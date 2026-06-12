<?php
//Include database configuration file
include('dbConfig.php');
function getBitrate($audioFormats='mp3'){
	return ("SELECT menuIndex, sbitrate, id, bitrate FROM audiobitrate WHERE ".$audioFormats." = 1");
}

if(isset($_POST["audioformatID"]) && !empty($_POST["audioformatID"])){
	$audioType = getAudioFormat($_POST["audioformatID"]);
    $query = $conn->query(getBitrate($audioType));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
            echo '<option  class="selectedlt" value="'.$row['id'].'">'.$row['sbitrate'].'</option>';
        }
    }
	$conn->close();
}
else if(isset($_POST["testID"]) && !empty($_POST["testID"])){
	$query = $conn->query("SELECT acodec, bitrate FROM stream WHERE id=".$_POST['testID']);
	$rowCount = $query->num_rows;
    if($rowCount > 0){
		$row = $query->fetch_assoc();
        $audiobitrate = $row['bitrate'];
		$audioformat = $row['acodec'];
    }
    $query = $conn->query(getBitrateCommand($audioformat));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
			if ($audiobitrate == $row['bitrate'])
				echo '<option selected class="selectedlt" value="'.$row['id'].'">'.$row['sbitrate'].'</option>';
			else
            	echo '<option  class="selectedlt" value="'.$row['id'].'">'.$row['sbitrate'].'</option>';
        }
    }
	$conn->close();
}
?>