<?php
//Include database configuration file
include('dbConfig.php');

if(isset($_POST["testID"]) && !empty($_POST["testID"])){
	$query = $conn->query("SELECT id,type FROM audioformat WHERE enable=1");
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
			if ($_POST["testID"] == $row['id'])
            	echo '<option class="selectedlt" selected value="'.$row['id'].'">'.$row['type'].'</option>';
			else
				echo '<option class="selectedlt" value="'.$row['id'].'">'.$row['type'].'</option>';
        }
    }
}
?>