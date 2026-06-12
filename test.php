<?php
	$conn = mysqli_connect("127.0.0.1","root","OTL324$","ED137");
	if($conn == false) {
     		die("Error: " . mysqli_error_connect());
	}
	//$strSQL = "SELECT * FROM member WHERE Username = 'admin' and Password = '123456'";
	//printf ("%s", $strSQL);
	//$objQuery = mysqli_query($conn,$strSQL);
system("sudo shutdown -h 0");
?>
