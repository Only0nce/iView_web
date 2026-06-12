<?php
	$serverName = "localhost";
	$userName = "userData";
	$userPassword = "Ifz8zean6868**";
	$dbName = "RFPowerMonitors";
    session_start();
	$conn = mysqli_connect($serverName,$userName,$userPassword,$dbName);
//	$strSQL = "SELECT * FROM member WHERE Username = '".($_POST['username'])."' and Password = '".($_POST['password'])."'";
	$options = [
		'cost' => 12,
	];

//	$newPassword = password_hash("123456", PASSWORD_BCRYPT, $options);
//	echo($newPassword);
//	echo("\n");
//	$strSQL = "UPDATE member SET Password='".$newPassword."' WHERE Username = '".($_POST['username'])."'";
//	echo($strSQL);
//	$objQuery = mysqli_query($conn,$strSQL);

	$strSQL = "SELECT * FROM member WHERE Username = '".($_POST['username'])."'";
//	echo($strSQL);
	$password = $_POST['password'];
        $objQuery = mysqli_query($conn,$strSQL);
        if (!$objQuery) {
                printf("Error: %s\n", $conn->error);
                exit();
        }
        $objResult = mysqli_fetch_array($objQuery);
        if(!$objResult)
        {
            echo("<script>location.href = '/login.php';</script>");
        }
        else
        {	
			if (password_verify($password, $objResult["Password"])){
				
			
			
				$_SESSION["UserID"] = $objResult["UserID"];
				$_SESSION["Status"] = $objResult["Status"];

				session_write_close();

				if($objResult["Status"] == "ADMIN")
				{
						echo("<script>location.href = '/index.php';</script>");
				}
				else
				{
						echo("<script>location.href = '/login.php';</script>");
				}
			}else
			{
				echo("<script>location.href = '/login.php';</script>");
//				echo($objResult["Password"]);
			}
        }
        mysqli_close($conn);

?>
