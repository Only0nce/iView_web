<?php
//db details
$dbHost = 'localhost';
$dbUsername = 'userData';
$dbPassword = 'Ifz8zean6868**';
$dbName = 'RFPowerMonitors';
// Audio Codecs ID
$MP3         = 1;
$AAC         = 2;
$HEAAC       = 3;
$HEAACv2     = 4;
$OggVorbis   = 5;
$PCM         = 6;
$FLAC        = 7;
//Connect and select the database
$conn = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}


function getAudioTypeByID($audioCodecID){
	return ("SELECT type FROM audioformat WHERE id=".$audioCodecID);
}

//$conn = new mysqli('localhost', 'root', 'OTL324$', 'streamer') or die('Cannot connect to db');
function getSamplerateCommand($audioFormats='MP3'){
	if ($audioFormats == 'MP3') $audioFormats = 'mp3';
	else if ($audioFormats == 'AAC') $audioFormats = ('aac');
	else if ($audioFormats == 'HE-AAC') $audioFormats = ('heaac');
	else if ($audioFormats == 'HE-AACv2') $audioFormats = ('heaacv2');
	else if ($audioFormats == 'Ogg Vorbis') $audioFormats = ('ogg');
	else if ($audioFormats == 'PCM') $audioFormats = ('pcm');
	else if ($audioFormats == 'FLAC') $audioFormats = ('flac');
	
	return ("SELECT ssamplerate, id, samplerate, samplerate FROM samplerate  WHERE ".$audioFormats." = 1");
}
function getSamplerateByID($samplerateID){
	return ("SELECT ssamplerate, id, samplerate, samplerate FROM samplerate  WHERE id=".$samplerateID);
}
function getBitrateCommand($audioFormats='MP3'){
	if ($audioFormats == 'MP3') $audioFormats = 'mp3';
	else if ($audioFormats == 'AAC') $audioFormats = ('aac');
	else if ($audioFormats == 'HE-AAC') $audioFormats = ('heaac');
	else if ($audioFormats == 'HE-AACv2') $audioFormats = ('heaacv2');
	else if ($audioFormats == 'Ogg Vorbis') $audioFormats = ('ogg');
	else if ($audioFormats == 'PCM') $audioFormats = ('pcm');
	else if ($audioFormats == 'FLAC') $audioFormats = ('flac');
	
	return ("SELECT sbitrate, id, bitrate FROM audiobitrate WHERE ".$audioFormats." = 1");
}
function getBitrateByID($audioBitrateID){
	return ("SELECT sbitrate, id, bitrate FROM audiobitrate WHERE id=".$audioBitrateID);
}

function getStreamprotocol($audioFormats='mp3'){
	
	return ("SELECT id, streamprotocol FROM protocol WHERE ".$audioFormats." = 1");
}
function getProtocol($audioFormats='MP3'){
	if ($audioFormats == 'MP3') $audioFormats = 'mp3';
	else if ($audioFormats == 'AAC') $audioFormats = ('aac');
	else if ($audioFormats == 'HE-AAC') $audioFormats = ('heaac');
	else if ($audioFormats == 'HE-AACv2') $audioFormats = ('heaacv2');
	else if ($audioFormats == 'Ogg Vorbis') $audioFormats = ('ogg');
	else if ($audioFormats == 'PCM') $audioFormats = ('pcm');
	else if ($audioFormats == 'FLAC') $audioFormats = ('flac');
	
	return ("SELECT id, streamprotocol FROM protocol WHERE ".$audioFormats." = 1");
}
function getProtocolByID($protocolID){
	return ("SELECT id, streamprotocol FROM protocol WHERE id=".$protocolID);
}
function getAudioDataFormat(){
	
	return ("SELECT rawformat, id, format FROM pcmformat WHERE enable = 1");
}

function getAudioFormat($audioID){
	$MP3         = 1;
	$AAC         = 2;
	$HEAAC       = 3;
	$HEAACv2     = 4;
	$OggVorbis   = 5;
	$PCM         = 6;
	$FLAC        = 7;
	if ($audioID == $MP3)
		return('mp3');
	else if ($audioID == $AAC)
		return('aac');
	else if ($audioID == $HEAAC)
		return('heaac');
	else if ($audioID == $HEAACv2)
		return('heaacv2');
	else if ($audioID == $OggVorbis)
		return('ogg');
	else if ($audioID == $PCM)
		return('pcm');
	else if ($audioID == $FLAC)
		return('flac');
}
?>
