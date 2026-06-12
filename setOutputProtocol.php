<?php
//Include database configuration file
include('dbConfig.php');

if(isset($_POST["audioformatID"]) && !empty($_POST["audioformatID"])){
	$audioType = getAudioFormat($_POST["audioformatID"]);
    $query = $conn->query(getStreamprotocol($audioType));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
            echo '<option class="selectedlt" value="'.$row['id'].'">'.$row['streamprotocol'].'</option>';
        }
    }
	$conn->close();
}
else if(isset($_POST["testID"]) && !empty($_POST["testID"])){
	$query = $conn->query("SELECT acodec, protocol FROM stream WHERE id=".$_POST['testID']);
	$rowCount = $query->num_rows;
    if($rowCount > 0){
		$row = $query->fetch_assoc();
        $protocol = $row['protocol'];
		$audioformat = $row['acodec'];
    }
    $query = $conn->query(getProtocol($audioformat));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
			if ($row['streamprotocol'] == $protocol)
				echo '<option selected class="selectedlt" value="'.$row['id'].'">'.$row['streamprotocol'].'</option>';
			else
				echo '<option class="selectedlt" value="'.$row['id'].'">'.$row['streamprotocol'].'</option>';
        }
    }
	$conn->close();
}
?>