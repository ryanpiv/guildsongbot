<?php

$url = 'https://discordapp.com/api/channels/300448798365450240/messages';

$ch = curl_init();
curl_setopt_array($ch, array(
	CURLOPT_URL => $url,
	CURLOPT_HTTPHEADER => array('Authorization: Bot 5k7fF7Xy4XcxpYOVnXhN7nt7fAOZXv1KOyZHHA9JhGdmXCeyFvkLXRy5vbSvW14D0rWz'),
	CURLOPT_RETURNTRANSFER => 1,
	CURLOPT_FOLLOWLOCATION => 1,
	CURLOPT_VERBOSE => 1,
	CURLOPT_SSL_VERIFYPEER => 0,
));
$response = curl_exec($ch);

if (!curl_exec($ch)) {
	print_r('Error: "' . curl_error($ch) . '" - Code: ' . curl_errno($ch));
} else {
	print_r($response);
}
curl_close($ch);

?>