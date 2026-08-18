<?php
/**
 * Transformation City Church - Pure PHP Authenticated SMTP Mailer for Hostinger
 * Connects directly to ssl://smtp.hostinger.com:465 with AUTH LOGIN
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: [];

$sendActualEmail = !empty($data['sendActualEmail']) || (isset($_GET['sendActualEmail']) && $_GET['sendActualEmail'] === 'true') || (isset($_GET['sendEmail']) && $_GET['sendEmail'] === 'true');

// Parse recipients cleanly
$rawList = ['admin@transformationcitychurch.org', 'leonandalouw@outlook.com'];
if (!empty($data['testRecipient'])) {
    $parts = explode(',', $data['testRecipient']);
    foreach ($parts as $p) {
        $clean = trim($p);
        if (!empty($clean) && filter_var($clean, FILTER_VALIDATE_EMAIL)) {
            $rawList[] = strtolower($clean);
        }
    }
}
$recipients = array_values(array_unique(array_filter($rawList)));

$smtpHost = 'smtp.hostinger.com';
$smtpUser = 'admin@transformationcitychurch.org';
$smtpPass = 'jxaiET4!';
$fromName = 'Transformation City Church';

$logs = [];
$logs[] = "Initializing Hostinger Authenticated SMTP on {$smtpHost}:465 (SSL)...";
$logs[] = "Target Admin Inboxes: " . implode(', ', $recipients);

function sendHostingerSmtpSocket($host, $port, $user, $pass, $fromEmail, $fromName, $recipients, $subject, $htmlBody, &$logs) {
    $timeout = 15;
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        $logs[] = "[ERROR] Could not connect to ssl://{$host}:{$port} - {$errstr} ({$errno})";
        return false;
    }

    stream_set_timeout($socket, $timeout);

    function readResponse($socket, &$logs) {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') {
                break;
            }
        }
        return trim($response);
    }

    function sendCommand($socket, $cmd, &$logs, $mask = false) {
        fwrite($socket, $cmd . "\r\n");
        $resp = readResponse($socket, $logs);
        if ($mask) {
            $logs[] = ">> [AUTH CREDENTIALS SENT] -> Response: {$resp}";
        } else {
            $logs[] = ">> {$cmd} -> Response: {$resp}";
        }
        return $resp;
    }

    $greeting = readResponse($socket, $logs);
    $logs[] = "Server Greeting: {$greeting}";
    if (substr($greeting, 0, 3) !== '220') {
        fclose($socket);
        return false;
    }

    $ehlo = sendCommand($socket, "EHLO tcchurch.co.za", $logs);
    if (substr($ehlo, 0, 3) !== '250') {
        fclose($socket);
        return false;
    }

    $authResp = sendCommand($socket, "AUTH LOGIN", $logs);
    if (substr($authResp, 0, 3) !== '334') {
        fclose($socket);
        return false;
    }

    $userResp = sendCommand($socket, base64_encode($user), $logs, true);
    if (substr($userResp, 0, 3) !== '334') {
        $logs[] = "[ERROR] Username rejected by Hostinger: {$userResp}";
        fclose($socket);
        return false;
    }

    $passResp = sendCommand($socket, base64_encode($pass), $logs, true);
    if (substr($passResp, 0, 3) !== '235') {
        $logs[] = "[ERROR] Authentication failed: {$passResp}";
        fclose($socket);
        return false;
    }

    $logs[] = "[SUCCESS] Hostinger SMTP Authentication Confirmed (Code 235: Authentication successful)";

    $mailFromResp = sendCommand($socket, "MAIL FROM:<{$user}>", $logs);
    if (substr($mailFromResp, 0, 3) !== '250') {
        fclose($socket);
        return false;
    }

    foreach ($recipients as $rcpt) {
        $rcptResp = sendCommand($socket, "RCPT TO:<{$rcpt}>", $logs);
        if (substr($rcptResp, 0, 3) !== '250') {
            $logs[] = "[WARN] Recipient <{$rcpt}> returned: {$rcptResp}";
        } else {
            $logs[] = "[OK] Recipient accepted: {$rcpt}";
        }
    }

    $dataResp = sendCommand($socket, "DATA", $logs);
    if (substr($dataResp, 0, 3) !== '354') {
        fclose($socket);
        return false;
    }

    // Build headers and email payload
    $toHeader = implode(', ', $recipients);
    $boundary = '=_tcc_' . md5(time());
    $msg = "From: {$fromName} <{$user}>\r\n";
    $msg .= "To: {$toHeader}\r\n";
    $msg .= "Reply-To: {$user}\r\n";
    $msg .= "Subject: {$subject}\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
    $msg .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $msg .= $htmlBody . "\r\n.\r\n";

    fwrite($socket, $msg);
    $sendResp = readResponse($socket, $logs);
    $logs[] = "Data Submission Result: {$sendResp}";

    sendCommand($socket, "QUIT", $logs);
    fclose($socket);

    return (substr($sendResp, 0, 3) === '250');
}

$emailSent = false;
$success = false;

if ($sendActualEmail) {
    $subject = "[TCC Live System Test] Hostinger Mail Verification - " . date('Y-m-d H:i:s');
    $toDisplay = implode(', ', $recipients);
    
    $htmlContent = '
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
        <div style="background-color: #a52424; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">
            Transformation City Church
          </h1>
          <p style="color: #fecdd3; margin: 4px 0 0 0; font-size: 13px;">Hostinger Live Email Dispatch Test</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            This test confirms that outgoing emails from <strong>tcchurch.co.za</strong> are actively delivered to all designated admin inboxes.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; border: 1px solid #e2e8f0;">
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: bold; color: #1e293b; width: 35%;">Server Host:</td>
              <td style="padding: 10px 14px; color: #334155;">smtp.hostinger.com (Port 465 SSL)</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: bold; color: #1e293b;">Authenticated Sender:</td>
              <td style="padding: 10px 14px; color: #334155;">admin@transformationcitychurch.org</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 14px; font-weight: bold; color: #1e293b;">Delivered Inboxes:</td>
              <td style="padding: 10px 14px; color: #334155;">' . htmlspecialchars($toDisplay) . '</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: bold; color: #1e293b;">Dispatched Time:</td>
              <td style="padding: 10px 14px; color: #334155;">' . date('Y-m-d H:i:s T') . '</td>
            </tr>
          </table>
          <div style="padding: 14px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px; color: #065f46; font-size: 13px;">
            &#10003; <strong>Verified:</strong> Hostinger SMTP transmission succeeded with code 250 OK.
          </div>
        </div>
      </div>
    </body>
    </html>';

    $emailSent = sendHostingerSmtpSocket($smtpHost, 465, $smtpUser, $smtpPass, $smtpUser, $fromName, $recipients, $subject, $htmlContent, $logs);
    $success = $emailSent;
    if ($emailSent) {
        $logs[] = "[SENT] Live email delivered to: " . $toDisplay;
    } else {
        $logs[] = "[FAILED] Could not complete SMTP transmission. Check credentials or firewall.";
    }
} else {
    // Just verify credentials over socket
    $timeout = 10;
    $context = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true]]);
    $socket = @stream_socket_client("ssl://{$smtpHost}:465", $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
    if ($socket) {
        $greeting = fgets($socket, 515);
        $logs[] = "Connected to Hostinger: " . trim($greeting);
        fwrite($socket, "EHLO tcchurch.co.za\r\n");
        while ($l = fgets($socket, 515)) { if (substr($l, 3, 1) === ' ') break; }
        fwrite($socket, "AUTH LOGIN\r\n");
        fgets($socket, 515);
        fwrite($socket, base64_encode($smtpUser) . "\r\n");
        fgets($socket, 515);
        fwrite($socket, base64_encode($smtpPass) . "\r\n");
        $authResp = fgets($socket, 515);
        if (substr(trim($authResp), 0, 3) === '235') {
            $logs[] = "[SUCCESS] Authentication verified (Code 235: Authentication successful)";
            $success = true;
        } else {
            $logs[] = "[ERROR] Authentication response: " . trim($authResp);
        }
        fwrite($socket, "QUIT\r\n");
        fclose($socket);
    } else {
        $logs[] = "[ERROR] Could not connect to {$smtpHost}:465 - {$errstr}";
    }
}

echo json_encode([
    'success' => $success,
    'authVerified' => $success,
    'workingPort' => 465,
    'host' => $smtpHost,
    'sender' => $smtpUser,
    'recipients' => $recipients,
    'emailSent' => $emailSent,
    'logs' => $logs
]);
