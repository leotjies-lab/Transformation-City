<?php
/**
 * Transformation City Church - Form Submission & Outgoing Email Dispatch
 * Authenticated Hostinger SSL Socket SMTP Mailer
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed. POST is required.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON request payload.']);
    exit;
}

$formTitle = $data['formTitle'] ?? $data['title'] ?? $data['formType'] ?? 'Transformation City Church Form';
$ownerEmail = $data['ownerEmail'] ?? 'admin@transformationcitychurch.org';
$answers = $data['answers'] ?? $data['data'] ?? [];
$createdAt = $data['createdAt'] ?? $data['submittedAt'] ?? date('Y-m-d H:i:s');

// Parse admin inboxes
$rawList = ['admin@transformationcitychurch.org', $ownerEmail, 'leonandalouw@outlook.com'];
$recipients = array_values(array_unique(array_filter($rawList)));

$smtpHost = 'smtp.hostinger.com';
$smtpUser = 'admin@transformationcitychurch.org';
$smtpPass = 'Op3nTh3Gat3!';
$fromName = 'Transformation City Church';

$fieldsHtml = '';
$fieldsText = '';

if (is_array($answers) && !empty($answers)) {
    foreach ($answers as $key => $val) {
        $displayVal = is_array($val) ? implode(', ', $val) : (string)$val;
        $fieldsText .= "- {$key}: {$displayVal}\n";
        $safeKey = htmlspecialchars($key);
        $safeVal = htmlspecialchars($displayVal ?: 'N/A');
        $fieldsHtml .= "
          <tr style=\"border-bottom: 1px solid #e2e8f0;\">
            <td style=\"padding: 10px 14px; font-weight: bold; color: #1e293b; background-color: #f8fafc; width: 35%; border-right: 1px solid #e2e8f0;\">{$safeKey}</td>
            <td style=\"padding: 10px 14px; color: #334155;\">{$safeVal}</td>
          </tr>";
    }
} else {
    $fieldsText = "No response answers provided.";
    $fieldsHtml = '<tr><td colspan="2" style="padding: 12px; text-align: center; color: #64748b;">No response answers provided.</td></tr>';
}

$subject = "[TCC Form Submission] " . $formTitle;
$toDisplay = implode(', ', $recipients);

$htmlBody = "
<!DOCTYPE html>
<html>
<head><meta charset=\"utf-8\"><title>{$formTitle}</title></head>
<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0;\">
  <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;\">
    <div style=\"background-color: #a52424; padding: 24px; text-align: center;\">
      <h1 style=\"color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;\">
        Transformation City Church
      </h1>
      <p style=\"color: #fecdd3; margin: 4px 0 0 0; font-size: 13px;\">Form Submission Notification</p>
    </div>
    <div style=\"padding: 24px;\">
      <div style=\"margin-bottom: 20px; padding: 12px 16px; background-color: #fff1f2; border-left: 4px solid #a52424; border-radius: 4px;\">
        <h2 style=\"margin: 0 0 4px 0; font-size: 16px; color: #881337;\">{$formTitle}</h2>
        <p style=\"margin: 0; font-size: 12px; color: #9f1239;\">Submitted on {$createdAt}</p>
      </div>
      <table style=\"width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;\">
        <thead>
          <tr style=\"background-color: #0f172a; color: #ffffff;\">
            <th style=\"padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase;\">Field</th>
            <th style=\"padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase;\">Submitted Response</th>
          </tr>
        </thead>
        <tbody>
          {$fieldsHtml}
        </tbody>
      </table>
      <div style=\"margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;\">
        Target Admin Recipients: <strong>{$toDisplay}</strong><br/>
        Transformation City Church Automated Form Notification
      </div>
    </div>
  </div>
</body>
</html>";

$replyTo = $answers['Email Address'] ?? $answers['email'] ?? $answers['Email'] ?? $answers['Email address'] ?? '';

function sendAuthenticatedHostingerMail($host, $port, $user, $pass, $fromEmail, $fromName, $recipients, $subject, $htmlBody, $replyTo) {
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
        return false;
    }

    function readLine($socket) {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        return trim($response);
    }

    $greeting = readLine($socket);
    if (substr($greeting, 0, 3) !== '220') { fclose($socket); return false; }

    fwrite($socket, "EHLO tcchurch.co.za\r\n");
    $ehlo = readLine($socket);
    if (substr($ehlo, 0, 3) !== '250') { fclose($socket); return false; }

    fwrite($socket, "AUTH LOGIN\r\n");
    $authResp = readLine($socket);
    if (substr($authResp, 0, 3) !== '334') { fclose($socket); return false; }

    fwrite($socket, base64_encode($user) . "\r\n");
    $userResp = readLine($socket);
    if (substr($userResp, 0, 3) !== '334') { fclose($socket); return false; }

    fwrite($socket, base64_encode($pass) . "\r\n");
    $passResp = readLine($socket);
    if (substr($passResp, 0, 3) !== '235') { fclose($socket); return false; }

    fwrite($socket, "MAIL FROM:<{$user}>\r\n");
    $mailFromResp = readLine($socket);
    if (substr($mailFromResp, 0, 3) !== '250') { fclose($socket); return false; }

    foreach ($recipients as $rcpt) {
        fwrite($socket, "RCPT TO:<{$rcpt}>\r\n");
        readLine($socket);
    }

    fwrite($socket, "DATA\r\n");
    $dataResp = readLine($socket);
    if (substr($dataResp, 0, 3) !== '354') { fclose($socket); return false; }

    $toHeader = implode(', ', $recipients);
    $msg = "From: {$fromName} <{$user}>\r\n";
    $msg .= "To: {$toHeader}\r\n";
    if (!empty($replyTo) && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $msg .= "Reply-To: {$replyTo}\r\n";
    }
    $msg .= "Subject: {$subject}\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
    $msg .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $msg .= $htmlBody . "\r\n.\r\n";

    fwrite($socket, $msg);
    $sendResp = readLine($socket);

    fwrite($socket, "QUIT\r\n");
    fclose($socket);

    return (substr($sendResp, 0, 3) === '250');
}

$dispatched = sendAuthenticatedHostingerMail($smtpHost, 465, $smtpUser, $smtpPass, $smtpUser, $fromName, $recipients, $subject, $htmlBody, $replyTo);

echo json_encode([
    'success' => true,
    'message' => "Form received and dispatched via Hostinger Authenticated SMTP to {$toDisplay}",
    'recipients' => $recipients,
    'smtpConfigured' => true,
    'socketDispatch' => $dispatched
]);
