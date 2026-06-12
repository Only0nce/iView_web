<?php	
include('dbConfig.php');
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
			mysqli_close($conn);
            echo("<script>location.href = '/changepass.php';</script>");
        }
        else
        {	
			if ((password_verify($password, $objResult["Password"])) || ($objResult["Password"] == ""))
			{
				if ($_POST['newpass'] == ($_POST['renewpass']))
				{
					$newPassword = password_hash($_POST['newpass'], PASSWORD_BCRYPT, $options);
					$strSQL = "UPDATE member SET Password='".$newPassword."' WHERE Username = '".($_POST['username'])."'";
					$objQuery = mysqli_query($conn,$strSQL);
					echo '<script language="javascript">';
				  	echo "alert('New password has been changedd')";
				  	echo '</script>';
					mysqli_close($conn);
					echo("<script>location.href = '/login.php';</script>");
				}
				else
				{
					echo '<script language="javascript">';
				  	echo "alert('Confirm password does not match.')";
				  	echo '</script>';
					mysqli_close($conn);
					echo("<script>location.href = '/changepass.php';</script>");
				}
			}
			else
			{
				mysqli_close($conn);
				echo("<script>location.href = '/changepass.php';</script>");
			}
        }
        mysqli_close($conn);

?>
