<?php
//Include database configuration file
include('dbConfig.php');

if(isset($_POST["audioformatID"]) && !empty($_POST["audioformatID"])){
	if ($_POST['audioformatID'] != $PCM)
		echo '<option class="selectedlt" value="14">Undefined</option>';
	else{
		$query = $conn->query('SELECT rawformat, id FROM pcmformat WHERE enable=1');
		$rowCount = $query->num_rows;
		if($rowCount > 0){
			while($row = $query->fetch_assoc()){ 
				echo '<option class="selectedlt" value="'.$row['id'].'">'.$row['rawformat'].'</option>';
			}
		}
		$conn->close();
	}
}
else if(isset($_POST["testID"]) && !empty($_POST["testID"])){
	$query = $conn->query("SELECT acodec, libcodec FROM stream WHERE id=".$_POST['testID']);
	$rowCount = $query->num_rows;
    if($rowCount > 0){
		$row = $query->fetch_assoc();
        $libcodec  = $row['libcodec'];
		$audioformat = $row['acodec'];
    }
	if ($audioformat != 'PCM')
		echo '<option class="selectedlt" value="14">Undefined</option>';
	else{
		$query = $conn->query('SELECT format, rawformat, id FROM pcmformat WHERE enable=1');
		$rowCount = $query->num_rows;
		if($rowCount > 0){
			while($row = $query->fetch_assoc()){ 
				if($row['format'] == $libcodec)
					echo '<option selected class="selectedlt" value="'.$row['id'].'">'.$row['rawformat'].'</option>';
				else 
					echo '<option class="selectedlt" value="'.$row['id'].'">'.$row['rawformat'].'</option>';
			}
		}
		$conn->close();
	}
}
?>