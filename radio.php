<?php
	session_start();
	if($_SESSION['UserID'] == "")
	{
		echo("<script>location.href = '/login.php';</script>");
	}

	if($_SESSION['Status'] != "ADMIN")
	{
		echo("<script>location.href = '/login.php';</script>");
	}	
?>
<!DOCTYPE HTML>
<?php
include('dbConfig.php');
include('ListAudioGain.php');
$strSQL = "SELECT deviceName FROM member";
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
	$deviceName = $objResult["deviceName"];
}
mysqli_close($conn);
echo '<html>';
echo '<head>';
echo '<title>'.$deviceName.'</title>';
?>
  <meta name="description" content="4 Wire to ED-137 Converter" />
  <meta name="keywords" content="ED137, SIP" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="styleServer.css" title="style" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionRadio.js"></script>
  <script type = "text/javascript">
	  
  </script>
</head>

<body>
<div id="header">
  <div id="logo">
	<div id="logo_text">
      <!-- class="logo_colour", allows you to change the colour of the text -->
      <?php	echo '<h1><a href="index.php"><span class="logo_colour">'.$deviceName.'</span></a></h1>'?>
      <!--          <h2>IFZ Technologies Co.,Ltd.</h2>-->
    </div>
  </div>
  <div id="menubar">
	<ul id="menu">
		<li><a href="index.php">MONITOR</a></li>
		<li><a href="ctrlinfo.php">CTRL INFO</a></li>
		<li><a href="controler.php">CONTROLERS</a></li>
		<li><a href="channel.php">CHANNELS</a></li>
		<li class="selected"><a href="radio.php">RADIOS</a></li>
		<li><a href="network.php">NETWORK</a></li>
		<li><a href="update.php">SYSTEM</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASSWORD</a></li>
	</ul>
  </div>
</div>
<div class="center">
<div class="site_content">
<?php
	echo '<div class="radiodiv">';
    echo  '<input type="text" value="Name"  disabled/>';
    echo  '<input type="text" value="URI" disabled/>';
    echo  '<input type="text" value="IP Address" disabled/>';
    echo  '<input type="text" value="SIP Port" disabled/>';
	echo  '<input type="text" value="Radio Type" disabled/>';
	echo '</div>';
	
	$conn = mysqli_connect($dbHost,$dbUsername,$dbPassword,$dbName);
	$strSQL = "SELECT * FROM radio ORDER BY 'id'";
	$objQuery = mysqli_query($conn,$strSQL);
	if (!$objQuery) {
			printf("Error: %s\n", $conn->error);
			exit();
	}
//	$objResult = mysqli_fetch_array($objQuery);
	if ($objQuery->num_rows > 0) 
	{
		while($row = $objQuery->fetch_assoc()) 
		{
//			echo '<form>';
			echo '<div class="radiodiv">';
				echo '<input type="text" placeholder="Radio Name" name="radioName'.$row["id"].'" id="radioName'.$row["id"].'" value="'.$row["name"].'"/>';
				echo '<input type="text" minlength="1" maxlength="15" pattern="[A-Za-z0-9]+ placeholder="Radio URI"  name="radioUri'.$row["id"].'" id="radioUri'.$row["id"].'" value="'.$row["uri"].'"/>';
				echo '<input type="text" minlength="7" maxlength="15" size="15" pattern="^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$" placeholder="xxx.xxx.xxx.xxx" name="radioIP'.$row["id"].'" id="radioIP'.$row["id"].'" value="'.$row["ipAddress"].'"/>';
				echo '<input type="number" placeholder="SIP Port"   min="0" max="65535" name="sipPort'.$row["id"].'" id="sipPort'.$row["id"].'" value="'.$row["sipPort"].'"/>';
			    echo '<select id="nodetype'.$row["id"].'" name="nodetype'.$row["id"].'" >';
			    $nodeTypeID = 0;
        		foreach ($nodeType as $rownodeType) {
					if (($row["trxMode"] == 'TRx') & ($rownodeType == 'Transceiver'))
						echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
					else if (($row["trxMode"] == 'Tx') & ($rownodeType == 'Transmitter'))
						echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
					else if (($row["trxMode"] == 'Rx') & ($rownodeType == 'Receiver'))
						echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
					else
						echo "<option  value='" . $nodeTypeID . "'>" . $rownodeType . "</option>";
					$nodeTypeID+=1;
    			}
				echo '</select>';
				echo '<button type="submit" onClick="updateRadio('.$row["id"].')" ;>UPDATE</button>';
				echo '<button type="submit" onClick="removeRadio('.$row["id"].')" ;>DELETE</button>';
				
			echo '</div>';
//			echo '</form>';
		}
	} 
	else 
	{
		echo "No Radio List";
	}
	mysqli_close($conn);



	
//	echo '<form>';
	echo '<div class="radiodiv">';
    echo  '<input type="text" placeholder="Radio Name" name="radioName" id="radioName" />';
    echo  '<input type="text" minlength="1" maxlength="16" pattern="[A-Za-z0-9]+" placeholder="URI" name="radioUri" id="radioUri"/>';
    echo  '<input type="text" minlength="7" maxlength="15" size="15" pattern="^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$" placeholder="xxx.xxx.xxx.xxx" name="radioIP" id="radioIP"/>';
    echo  '<input type="number" placeholder="SIP Port" min="0" max="65535" name="sipPort" id="sipPort"/>';
	echo '<select id="nodetype" name="nodetype" >';
			    $nodeTypeID = 0;
        		foreach ($nodeType as $rownodeType) {
					echo "<option  value='" . $nodeTypeID . "'>" . $rownodeType . "</option>";
					$nodeTypeID+=1;
    			}
				echo '</select>';
	echo  '<button type="submit" id="newRadio" name="newRadio" onClick="newRadio()" ;>NEW</button>';
	echo '</div>';
//	echo '</form>';
?>
</div>

<div id="footer">
      IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.
</div>
</body>
</html>
