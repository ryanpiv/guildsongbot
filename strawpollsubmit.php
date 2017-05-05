<?php

$url = 'https://strawpoll.me/api/v2/polls';

$votes = $_POST['options'];

$options = array(
	'title' => $_POST['title'],
	'options' => json_decode($votes),
);

$options = json_encode($options);

$headers = array(
	"Content-Type: application/json",
);

$ch = curl_init();
curl_setopt_array($ch, array(
	CURLOPT_URL => $url,
	CURLOPT_RETURNTRANSFER => 1,
	CURLOPT_FOLLOWLOCATION => 1,
	CURLOPT_VERBOSE => 1,
	CURLOPT_SSL_VERIFYPEER => 0,
	CURLOPT_POST => 1,
	CURLOPT_POSTFIELDS => $options,
	CURLOPT_HTTPHEADER => $headers,
));
$response = curl_exec($ch);

if (!curl_exec($ch)) {
	print_r('Error: "' . curl_error($ch) . '" - Code: ' . curl_errno($ch));
} else {
	print_r($response);
}
curl_close($ch);

?>