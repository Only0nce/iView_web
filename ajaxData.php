<?php
//Include database configuration file
include('dbConfig.php');
function getBitrate($audioFormats='mp3'){
	return ("SELECT sbitrate, id, bitrate FROM audiobitrate WHERE ".$audioFormats." = 1");
}
// $AACBitrateList = $conn->query(getBitrate('aac'));
// $HEAACBitrateList =  $conn->query(getBitrate('heaac')); 
// $HEAACV2BitrateList = $conn->query(getBitrate('heaacv2')); 
// $MP3BitrateList = $conn->query(getBitrate('mp3')); 
// $OggBitrateList = $conn->query(getBitrate('ogg')); 
// $PCMBitrateList = $conn->query(getBitrate('pcm')); 
// $FLACBitrateList = $conn->query(getBitrate('flac')); 
// 
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
if(isset($_POST["audioformatID"]) && !empty($_POST["audioformatID"])){
	$audioType = getAudioFormat($_POST["audioformatID"]);
    $query = $conn->query(getBitrate($audioType));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
            echo '<option value="'.$row['id'].'">'.$row['sbitrate'].'</option>';
        }
    }
}
?>