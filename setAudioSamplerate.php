<?php
//Include database configuration file
include('dbConfig.php');
function getBitrate($audioFormats='mp3'){
	return ("SELECT ssamplerate, id, samplerate FROM samplerate WHERE ".$audioFormats." = 1");
}

if(isset($_POST["audioformatID"]) && !empty($_POST["audioformatID"])){
	$audioType = getAudioFormat($_POST["audioformatID"]);
    $query = $conn->query(getBitrate($audioType));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
            echo '<option class="selectedlt" value="'.$row['id'].'">'.$row['ssamplerate'].'</option>';
        }
    }
	$conn->close();
}
else if(isset($_POST["testID"]) && !empty($_POST["testID"])){
	$query = $conn->query("SELECT acodec, samplerate FROM stream WHERE id=".$_POST['testID']);
	$rowCount = $query->num_rows;
    if($rowCount > 0){
		$row = $query->fetch_assoc();
        $samplerate  = $row['samplerate'];
		$audioformat = $row['acodec'];
    }
    $query = $conn->query(getSamplerateCommand($audioformat));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
			if ($samplerate == $row['samplerate'])
				echo '<option class="selectedlt" selected value="'.$row['id'].'">'.$row['ssamplerate'].'</option>';
			else
            	echo '<option class="selectedlt" value="'.$row['id'].'">'.$row['ssamplerate'].'</option>';
        }
    }
	$conn->close();
}
?>