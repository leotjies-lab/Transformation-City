<?php
/**
 * Transformation City Church - Google Drive Media & Audio Streaming Proxy for PHP / Hostinger
 * Supports HTTP Range Requests (Audio scrubbing/seeking), Large File Virus Confirmations, and CORS.
 */

// Allow CORS for web audio players
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, HEAD, OPTIONS");
header("Access-Control-Allow-Headers: Range, Content-Type, Accept, Origin");
header("Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? 'stream';
$fileId = $_GET['id'] ?? '';
$filename = $_GET['filename'] ?? 'sermon.mp3';
$targetUrl = $_GET['url'] ?? '';

// Sanitize file ID
$fileId = preg_replace('/[^a-zA-Z0-9_-]/', '', $fileId);

// Handle folder listing action
if ($action === 'files') {
    header("Content-Type: application/json; charset=UTF-8");
    $folderId = $_GET['folderId'] ?? '1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM';
    $folderId = preg_replace('/[^a-zA-Z0-9_-]/', '', $folderId);
    
    $folderUrl = "https://drive.google.com/drive/folders/" . $folderId;
    $ch = curl_init($folderUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        CURLOPT_HTTPHEADER => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language: en-US,en;q=0.9'
        ],
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $html = curl_exec($ch);
    curl_close($ch);

    $files = [];
    $seenIds = [];

    $addPhpParsedFile = function($id, $rawName) use (&$files, &$seenIds) {
        if (empty($id) || strlen($id) < 20 || isset($seenIds[$id])) return;
        $name = trim(stripcslashes($rawName));
        $name = str_replace(['\x22', '\x5b', '\x5d'], ['"', '[', ']'], $name);
        if (empty($name) || strlen($name) < 2) return;

        $seenIds[$id] = true;
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $isAudio = in_array($ext, ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'flac', 'opus', 'wma']);
        $isNotes = in_array($ext, ['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt', 'ppt', 'pptx']);

        $mime = $isAudio ? ($ext === 'mp3' ? 'audio/mpeg' : 'audio/' . $ext) : ($isNotes ? ($ext === 'pdf' ? 'application/pdf' : 'application/msword') : 'application/octet-stream');

        $files[] = [
            'id' => $id,
            'name' => $name,
            'mimeType' => $mime,
            'category' => $isAudio ? 'audio' : ($isNotes ? 'notes' : 'other'),
            'isAudio' => $isAudio,
            'isNotes' => $isNotes,
            'webViewLink' => "https://drive.google.com/file/d/{$id}/view",
            'streamUrl' => $isAudio ? "/drive-proxy.php?action=stream&id={$id}" : null,
            'downloadUrl' => "/drive-proxy.php?action=download&id={$id}&filename=" . urlencode($name),
            'notesViewUrl' => $isNotes ? "/drive-proxy.php?action=notes_view&id={$id}&filename=" . urlencode($name) : null,
            'notesDownloadUrl' => $isNotes ? "/drive-proxy.php?action=notes_download&id={$id}&filename=" . urlencode($name) : null,
        ];
    };

    if ($html) {
        // Method 1: Modern AF_initDataCallback chunk scanner
        $itemBlocks = preg_split('/\[\[(?:null,)?\"([a-zA-Z0-9_-]{25,})\"\]/', $html, -1, PREG_SPLIT_DELIM_CAPTURE);
        if (is_array($itemBlocks)) {
            for ($i = 1; $i < count($itemBlocks); $i += 2) {
                $id = $itemBlocks[$i];
                $chunk = $itemBlocks[$i + 1] ?? "";
                if (preg_match('/\[\[\[\"([^\"]+\.(?:mp3|m4a|wav|aac|ogg|wma|pdf|docx?|txt|pptx?|rtf|mp4|mov))\"/i', $chunk, $m) ||
                    preg_match('/\"([^\"]+\.(?:mp3|m4a|wav|aac|ogg|wma|pdf|docx?|txt|pptx?|rtf|mp4|mov))\"/i', $chunk, $m)) {
                    $addPhpParsedFile($id, $m[1]);
                }
            }
        }

        // Method 2: Hex encoded / unescaped file links
        $unescaped = str_replace(['\x22', '\x5b', '\x5d', '\/'], ['"', '[', ']', '/'], $html);
        if (preg_match_all('/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{25,})\/[^\"]*?\"([^\"]+\.(?:mp3|m4a|wav|aac|ogg|wma|pdf|docx?|txt|pptx?|rtf|mp4|mov))\"/i', $unescaped, $linkMatches, PREG_SET_ORDER)) {
            foreach ($linkMatches as $lm) {
                $addPhpParsedFile($lm[1], $lm[2]);
            }
        }

        // Method 3: Legacy Google Drive JSON notation
        if (preg_match_all('/\[\"([a-zA-Z0-9_-]{25,})\",\[\"([^"]+)\"/i', $html, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $addPhpParsedFile($match[1], $match[2]);
            }
        }
    }

    echo json_encode([
        'success' => true,
        'folderId' => $folderId,
        'totalFiles' => count($files),
        'files' => $files
    ]);
    exit;
}

// If generic URL proxy requested
if ($action === 'proxy' && !empty($targetUrl)) {
    streamRemoteUrl($targetUrl, 'audio/mpeg', false, $filename);
    exit;
}

if (empty($fileId)) {
    http_response_code(400);
    header("Content-Type: text/plain");
    echo "Missing file id";
    exit;
}

// Determine MIME and disposition based on action
$isDownload = in_array($action, ['download', 'notes_download']);
$isNotes = in_array($action, ['notes_view', 'notes_download']);
$contentType = $isNotes ? 'application/pdf' : 'audio/mpeg';

// Stream Google Drive File with token handling and range chunking
streamGoogleDriveFile($fileId, $contentType, $isDownload, $filename);

/**
 * Stream a Google Drive file by ID with virus warning bypass, chunking, and HTTP Range support
 */
function streamGoogleDriveFile($fileId, $defaultContentType = 'audio/mpeg', $isAttachment = false, $filename = 'sermon.mp3') {
    $candidateUrls = [
        "https://drive.usercontent.google.com/download?id={$fileId}&export=download&authuser=0&confirm=t",
        "https://docs.google.com/uc?export=download&id={$fileId}&confirm=t",
        "https://drive.google.com/uc?export=download&id={$fileId}&confirm=t",
        "https://drive.google.com/uc?export=open&id={$fileId}",
    ];

    $rangeHeader = $_SERVER['HTTP_RANGE'] ?? null;
    $tempCookieFile = tempnam(sys_get_temp_dir(), 'gdrive_cookie_');

    foreach ($candidateUrls as $url) {
        $ch = curl_init($url);
        
        $headers = [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept: */*',
        ];
        if ($rangeHeader) {
            $headers[] = 'Range: ' . $rangeHeader;
        }

        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_NOBODY => false,
            CURLOPT_COOKIEJAR => $tempCookieFile,
            CURLOPT_COOKIEFILE => $tempCookieFile,
            CURLOPT_TIMEOUT => 25,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $effContentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);

        if (!$response) {
            continue;
        }

        $respHeaders = substr($response, 0, $headerSize);
        $respBody = substr($response, $headerSize);

        // Check if Google returned a virus scan confirmation page (HTML) for large files (>25MB)
        if (strpos($effContentType, 'text/html') !== false && preg_match('/confirm=([0-9a-zA-Z_-]+)/', $respBody, $confirmMatch)) {
            $confirmToken = $confirmMatch[1];
            $confirmedUrl = "https://drive.google.com/uc?export=download&id={$fileId}&confirm={$confirmToken}";
            
            // Re-fetch with confirmation token
            $ch = curl_init($confirmedUrl);
            curl_setopt_array($ch, [
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_RETURNTRANSFER => false,
                CURLOPT_COOKIEFILE => $tempCookieFile,
                CURLOPT_TIMEOUT => 0, // Streaming
                CURLOPT_SSL_VERIFYPEER => false,
            ]);

            sendStreamingHeaders($defaultContentType, $isAttachment, $filename);
            curl_exec($ch);
            curl_close($ch);
            @unlink($tempCookieFile);
            exit;
        }

        // If direct streamable audio/binary content was returned
        if ($httpCode >= 200 && $httpCode < 300 && strpos($effContentType, 'text/html') === false) {
            // Forward headers
            if ($httpCode === 206) {
                http_response_code(206);
            } else {
                http_response_code(200);
            }

            header("Content-Type: " . (!empty($effContentType) && !str_contains($effContentType, 'html') ? $effContentType : $defaultContentType));
            header("Accept-Ranges: bytes");
            header("Cache-Control: public, max-age=86400");

            if ($isAttachment) {
                header('Content-Disposition: attachment; filename="' . rawurlencode($filename) . '"');
            } else {
                header('Content-Disposition: inline; filename="' . rawurlencode($filename) . '"');
            }

            // Extract and pass Content-Length & Content-Range if present
            if (preg_match('/Content-Length:\s*(\d+)/i', $respHeaders, $clMatch)) {
                header("Content-Length: " . $clMatch[1]);
            }
            if (preg_match('/Content-Range:\s*([^\r\n]+)/i', $respHeaders, $crMatch)) {
                header("Content-Range: " . $crMatch[1]);
            }

            echo $respBody;
            @unlink($tempCookieFile);
            exit;
        }
    }

    @unlink($tempCookieFile);

    // If direct cURL streaming could not fetch audio, redirect directly to Google Drive download URL
    header("Location: https://drive.google.com/uc?export=download&id={$fileId}");
    exit;
}

/**
 * Stream arbitrary remote URL
 */
function streamRemoteUrl($url, $defaultContentType, $isAttachment, $filename) {
    $rangeHeader = $_SERVER['HTTP_RANGE'] ?? null;
    $ch = curl_init($url);
    
    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    if ($rangeHeader) {
        $headers[] = 'Range: ' . $rangeHeader;
    }

    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_HEADER => false,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    sendStreamingHeaders($defaultContentType, $isAttachment, $filename);
    curl_exec($ch);
    curl_close($ch);
    exit;
}

function sendStreamingHeaders($contentType, $isAttachment, $filename) {
    header("Content-Type: {$contentType}");
    header("Accept-Ranges: bytes");
    header("Access-Control-Allow-Origin: *");
    if ($isAttachment) {
        header('Content-Disposition: attachment; filename="' . rawurlencode($filename) . '"');
    } else {
        header('Content-Disposition: inline; filename="' . rawurlencode($filename) . '"');
    }
}
