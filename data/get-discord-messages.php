<?php

$url = 'https://discordapp.com/api/channels/300448798365450240/messages?limit=100';

$ch = curl_init();
curl_setopt_array($ch, array(
	CURLOPT_URL => $url,
	CURLOPT_HTTPHEADER => array('Authorization: Bot MzAwODEwOTE1NTg0OTMzODg4.C-0eXA.B6uha44_ewJlbJ4cTHfbOtFy2TQ'),
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