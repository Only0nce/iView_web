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
  <script type="text/javascript" src="myfunctionChannel.js"></script>
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
		<li class="selected"><a href='#' onclick='location.reload(true); return false;'>CHANNELS</a></li>
		<li><a href="radio.php">RADIOS</a></li>
		<li><a href="network.php">NETWORK</a></li>
		<li><a href="update.php">SYSTEM</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASSWORD</a></li>
	</ul>
  </div>
</div>
  <div class ="site_content">
<?php
	$currentChannelID = 0;    

	if(isset($_POST['channelSelecter'])){
		$currentChannelID = $_POST['channelSelecter'];
	}

	$conn = mysqli_connect($dbHost,$dbUsername,$dbPassword,$dbName);
	
	$strSQL = "SELECT * FROM channel ORDER BY 'id'";
	$objQuery = mysqli_query($conn,$strSQL);
	if (!$objQuery) {
			printf("Error: %s\n", $conn->error);
			exit();
	}

	$radioArray = array("name"=>"");
	$strSQL = "SELECT * FROM radio";
	$radioQuery = mysqli_query($conn,$strSQL);
	if (!$radioQuery) {
			printf("Error: %s\n", $conn->error);
			exit();
	}
	
	while($rowRadioData = mysqli_fetch_assoc($radioQuery))
	{
		$radioArray[] = $rowRadioData;
	}
//    echo $radioArray;

	{
		echo '<h2></h2>';
		echo '<form method="POST">';
		echo '<div class="channeldiv">';
		echo '<input type="text" value="Channel Selected" disabled/>';
		echo '<select id="channelSelecter" name="channelSelecter" onchange="this.form.submit()">';
		if ($currentChannelID == -1)
			echo "<option  value='-1' selected>New Channel</option>";
		else
			echo "<option  value='-1' >New Channel</option>";
		if ($currentChannelID == 0)
			echo "<option  value='0' selected>All Channel</option>";
		else
			echo "<option  value='0' >All Channel</option>";
		
		if ($objQuery->num_rows > 0) 
		{
			$x = 0;
			while($row = $objQuery->fetch_assoc())
			{
				$channelNameList[$x] = $row["channelName"];	
				if ($currentChannelID == $row['id'])
					echo "<option  value='" . $row["id"] . "' selected>" . $row["channelName"] . "  </option>";
				else
					echo "<option  value='" . $row["id"] . "' >" . $row["channelName"] . "  </option>";
			}
		}
			else 
		{

			// echo "No Channel List";
		}
		echo '</select>';
		echo '</div>';
		echo '</form>';

		if ($currentChannelID == -1)
		{
			echo '<h2></h2>';
			echo '<div class="channeldiv">';
			echo  '<input type="text" value="Channel Name"  disabled/>';
			echo '<input type="text" placeholder="New Channel Name" name="channelName" id="channelName" value=""/>';
			echo  '<input type="text" value="Tx-Rx Mode" disabled/>';
			echo  '<input type="text" value="Tx/TRx Radio" disabled/>';
			echo  '<input type="text" value="Separate Radio" disabled/>';		
			echo '</div>';

			echo '<div class="channeldiv">';
			echo '<input type="text" value="Main Radio" disabled/>';
			echo '<input type="text" placeholder="Main Radio Name" name="mainRadioName" id="mainRadioName" value=""/>';
			echo '<select id="channelType" name="channelType" >';
			$nodeTypeID = 0;
			foreach ($channelType as $rownodeType) 
			{
				if (($row["mainRadioType"] == 'TRx') & ($rownodeType == 'Transceiver'))
					echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
				else if (($row["mainRadioType"] == 'Tx') & ($rownodeType == 'Transmitter'))
					echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
				else if (($row["mainRadioType"] == 'Rx') & ($rownodeType == 'Receiver'))
					echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
				else if (($row["mainRadioType"] == 'Separate') & ($rownodeType == 'Separate'))
						echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
				else
					echo "<option  value='" . $nodeTypeID . "'>" . $rownodeType . "</option>";
				$nodeTypeID+=1;
			}
			echo '</select>';
			echo '<select id="mainRadio01ID" name="mainRadio01ID" >';
			foreach ($radioArray as $rowRadio)
			{
				if ($rowRadio["id"] == $row["mainRadio01ID"]){
					if ($rowRadio["id"] > 0)
						echo "<option  value='" . $rowRadio["id"] . "' selected>" . $rowRadio["name"] . "  </option>";
					else
						echo "<option  value='" . '0' . "' selected>" . "Tx/TRx Radio Select" . "  </option>";
				}
				else if ($rowRadio["id"] > 0)
					echo "<option  value='" . $rowRadio["id"] . "'>" . $rowRadio["name"] . "  </option>";
				else
					echo "<option  value='" . '0' . "' selected>" . "Tx/TRx Radio Select" . "  </option>";
			}
			echo '</select>';
			echo '<select id="mainRadio02ID" name="mainRadio02ID" >';

			foreach ($radioArray as $rowRadio)  
			{
				if ($rowRadio["id"] == $row["mainRadio02ID"]){
					if ($rowRadio["id"] > 0)
						echo "<option  value='" . $rowRadio["id"] . "' selected>" . $rowRadio["name"] . "  </option>";
					else
						echo "<option  value='" . '0' . "' selected>" . "Rx Radio Select" . "  </option>";
				}
				else if ($rowRadio["id"] > 0)
					echo "<option  value='" . $rowRadio["id"] . "'>" . $rowRadio["name"] . "  </option>";
				else
					echo "<option  value='" . '0' . "' selected>" . "Rx Radio Select" . "  </option>";
			}
			echo '</select>';
			echo '</div>';

			echo '<div class="channeldiv">';
			echo '<input type="text" value="Standby Radio" disabled/>';
			echo '<input type="text" placeholder="Standby Radio Name" name="standbyRadioName" id="standbyRadioName" value=""/>';
			echo '<select id="standbyRadioChannelType" name="standbyRadioChannelType" >';
			$nodeTypeID = 0;
			foreach ($channelType as $rownodeType) {
				if (($row["standByRadioType"] == 'TRx') & ($rownodeType == 'Transceiver'))
					echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
				else if (($row["standByRadioType"] == 'Tx') & ($rownodeType == 'Transmitter'))
					echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
				else if (($row["standByRadioType"] == 'Rx') & ($rownodeType == 'Receiver'))
					echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
				else if (($row["standByRadioType"] == 'Separate') & ($rownodeType == 'Separate'))
						echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
				else
					echo "<option  value='" . $nodeTypeID . "'>" . $rownodeType . "</option>";
				$nodeTypeID+=1;
			}
			echo '</select>';
			echo '<select id="standbyRadio01ID" name="standbyRadio01ID" >';
			foreach ($radioArray as $rowRadio)
			{
				if ($rowRadio["id"] == $row["standByRadio01ID"]){
					if ($rowRadio["id"] > 0)
						echo "<option  value='" . $rowRadio["id"] . "' selected>" . $rowRadio["name"] . "  </option>";
					else
						echo "<option  value='" . '0' . "' selected>" . "Tx/TRx Radio Select" . "  </option>";
				}
				else if ($rowRadio["id"] > 0)
					echo "<option  value='" . $rowRadio["id"] . "'>" . $rowRadio["name"] . "  </option>";
				else
					echo "<option  value='" . '0' . "' selected>" . "Tx/TRx Radio Select" . "  </option>";
			}
			echo '</select>';
			echo '<select id="standbyRadio02ID" name="standbyRadio02ID" >';

			foreach ($radioArray as $rowRadio)  
			{
				if ($rowRadio["id"] == $row["standByRadio02ID"]){
					if ($rowRadio["id"] > 0)
						echo "<option  value='" . $rowRadio["id"] . "' selected>" . $rowRadio["name"] . "  </option>";
					else
						echo "<option  value='" . '0' . "' selected>" . "Rx Radio Select" . "  </option>";
				}
				else if ($rowRadio["id"] > 0)
					echo "<option  value='" . $rowRadio["id"] . "'>" . $rowRadio["name"] . "  </option>";
				else
					echo "<option  value='" . '0' . "' selected>" . "Rx Radio Select" . "  </option>";
			}
			echo '</select>';
			echo '<button type="submit" onClick="newChannel()" ;>NEW</button>';

			echo '</div>';
		}
	}

	if ($currentChannelID >= 0)
	{

		$strSQL = "SELECT * FROM channel ORDER BY 'id'";
		$objQuery = mysqli_query($conn,$strSQL);
		if (!$objQuery) {
				printf("Error: %s\n", $conn->error);
				exit();
		}

	    if ($objQuery->num_rows > 0) 
		{
			while($row = $objQuery->fetch_assoc())
			{
				
				if (($currentChannelID == $row['id']) || ($currentChannelID == 0))
				{
					echo '<h2></h2>';
					echo '<div class="channeldiv">';
					echo  '<input type="text" value="Channel Name"  disabled/>';
					echo '<input type="text" placeholder="Channel Name" name="channelName'.$row["id"].'" id="channelName'.$row["id"].'" value="'.$row["channelName"].'"/>';
					echo  '<input type="text" value="Tx-Rx Mode" disabled/>';
					echo  '<input type="text" value="Tx/TRx Radio" disabled/>';
					echo  '<input type="text" value="Separate Radio" disabled/>';
					echo '</div>';
					echo '<div class="channeldiv">';
						
						echo '<input type="text" value="Main Radio" disabled/>';
						echo '<input type="text" placeholder="Main Radio Name" name="mainRadioName'.$row["id"].'" id="mainRadioName'.$row["id"].'" value="'.$row["mainRadioName"].'"/>';
					    echo '<select id="channelType'.$row["id"].'" name="channelType'.$row["id"].'" >';
					    $nodeTypeID = 0;
		        		foreach ($channelType as $rownodeType) {
							if (($row["mainRadioType"] == 'TRx') & ($rownodeType == 'Transceiver'))
								echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
							else if (($row["mainRadioType"] == 'Tx') & ($rownodeType == 'Transmitter'))
								echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
							else if (($row["mainRadioType"] == 'Rx') & ($rownodeType == 'Receiver'))
								echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
							else if (($row["mainRadioType"] == 'Separate') & ($rownodeType == 'Separate'))
								echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
							else
								echo "<option  value='" . $nodeTypeID . "'>" . $rownodeType . "</option>";
							$nodeTypeID+=1;
		    			}
						echo '</select>';
						echo '<select id="mainRadio01ID'.$row["id"].'" name="mainRadio01ID'.$row["id"].'" >';
						foreach ($radioArray as $rowRadio)
						{
							if ($rowRadio["id"] == $row["mainRadio01ID"]){
								if ($rowRadio["id"] > 0)
									echo "<option  value='" . $rowRadio["id"] . "' selected>" . $rowRadio["name"] . "  </option>";
								else
									echo "<option  value='" . '0' . "' selected>" . "Tx/TRx Radio Select" . "  </option>";
							}
							else if ($rowRadio["id"] > 0)
								echo "<option  value='" . $rowRadio["id"] . "'>" . $rowRadio["name"] . "  </option>";
							else
								echo "<option  value='" . '0' . "' selected>" . "Tx/TRx Radio Select" . "  </option>";
		    			}
						echo '</select>';
						echo '<select id="mainRadio02ID'.$row["id"].'" name="mainRadio02ID'.$row["id"].'" >';
						
						foreach ($radioArray as $rowRadio)  
						{
							if ($rowRadio["id"] == $row["mainRadio02ID"]){
								if ($rowRadio["id"] > 0)
									echo "<option  value='" . $rowRadio["id"] . "' selected>" . $rowRadio["name"] . "  </option>";
								else
									echo "<option  value='" . '0' . "' selected>" . "Rx Radio Select" . "  </option>";
							}
							else if ($rowRadio["id"] > 0)
								echo "<option  value='" . $rowRadio["id"] . "'>" . $rowRadio["name"] . "  </option>";
							else
								echo "<option  value='" . '0' . "' selected>" . "Rx Radio Select" . "  </option>";
		    			}
						echo '</select>';

						echo '<button type="submit" onClick="updateChannel('.$row["id"].','.$x.')" ;>UPDATE</button>';


						echo '<input type="text" value="Standby Radio" disabled/>';
						echo '<input type="text" placeholder="Standby Radio Name" name="standbyRadioName'.$row["id"].'" id="standbyRadioName'.$row["id"].'" value="'.$row["standbyRadioName"].'"/>';
					    echo '<select id="standbyRadioChannelType'.$row["id"].'" name="standbyRadioChannelType'.$row["id"].'" >';
					    $nodeTypeID = 0;
		        		foreach ($channelType as $rownodeType) {
							if (($row["standByRadioType"] == 'TRx') & ($rownodeType == 'Transceiver'))
								echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
							else if (($row["standByRadioType"] == 'Tx') & ($rownodeType == 'Transmitter'))
								echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
							else if (($row["standByRadioType"] == 'Rx') & ($rownodeType == 'Receiver'))
								echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
							else if (($row["standByRadioType"] == 'Separate') & ($rownodeType == 'Separate'))
								echo "<option  value='" . $nodeTypeID . "' selected>" . $rownodeType . "  </option>";
							else
								echo "<option  value='" . $nodeTypeID . "'>" . $rownodeType . "</option>";
							$nodeTypeID+=1;
		    			}
						echo '</select>';
						echo '<select id="standbyRadio01ID'.$row["id"].'" name="standbyRadio01ID'.$row["id"].'" >';
						foreach ($radioArray as $rowRadio)
						{
							if ($rowRadio["id"] == $row["standByRadio01ID"]){
								if ($rowRadio["id"] > 0)
									echo "<option  value='" . $rowRadio["id"] . "' selected>" . $rowRadio["name"] . "  </option>";
								else
									echo "<option  value='" . '0' . "' selected>" . "Tx/TRx Radio Select" . "  </option>";
							}
							else if ($rowRadio["id"] > 0)
								echo "<option  value='" . $rowRadio["id"] . "'>" . $rowRadio["name"] . "  </option>";
							else
								echo "<option  value='" . '0' . "' selected>" . "Tx/TRx Radio Select" . "  </option>";
		    			}
						echo '</select>';
						echo '<select id="standbyRadio02ID'.$row["id"].'" name="standbyRadio02ID'.$row["id"].'" >';
						
						foreach ($radioArray as $rowRadio)  
						{
							if ($rowRadio["id"] == $row["standByRadio02ID"]){
								if ($rowRadio["id"] > 0)
									echo "<option  value='" . $rowRadio["id"] . "' selected>" . $rowRadio["name"] . "  </option>";
								else
									echo "<option  value='" . '0' . "' selected>" . "Rx Radio Select" . "  </option>";
							}
							else if ($rowRadio["id"] > 0)
								echo "<option  value='" . $rowRadio["id"] . "'>" . $rowRadio["name"] . "  </option>";
							else
								echo "<option  value='" . '0' . "' selected>" . "Rx Radio Select" . "  </option>";
		    			}
						echo '</select>';
						echo '<button type="submit" onClick="removeChannel('.$row["id"].')" ;>DELETE</button>';
						
					echo '</div>';
				}
			}
		} 
		else 
		{
			echo "No Channel List";
		}
	}
	mysqli_close($conn);

	
	echo('<script type="text/javascript">updateChannelNameList('.json_encode($channelNameList,true).');</script>');
?>
	
  </div>

<div id="footer">
      IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.
</div>
</body>
</html>
