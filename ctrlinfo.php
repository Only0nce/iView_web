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
  <script type="text/javascript" src="myfunctionCtrlinfo.js"></script>
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
		<li class="selected"><a href='#' onclick='location.reload(true); return false;'>CTRL INFO</a></li>
		<li><a href="controler.php">CONTROLERS</a></li>
		<li><a href="channel.php">CHANNELS</a></li>
		<li><a href="radio.php">RADIOS</a></li>
		<li><a href="network.php">NETWORK</a></li>
		<li><a href="update.php">SYSTEM</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASSWORD</a></li>
	</ul>
  </div>
</div>
<div class="site_content_left">
<div class="site_content">
	 <div class="ctrlinfodiv">
    	<input type="text" value="Connected channel"  disabled/>
		<select id="ctrlSelect" name="ctrlSelect" onChange="clearform()">
			<option  value='0'>Please Select</option>
			<?php
				$strSQL = "SELECT * FROM iGatePlus.controler WHERE channelID>0";

				$objQuery = mysqli_query($conn,$strSQL);
				if (!$objQuery) {
						printf("Error: %s\n", $conn->error);
						exit();
				}

				if ($objQuery->num_rows > 0) 
				{
					while($row = $objQuery->fetch_assoc()) 
					{
						echo "<option  value='" . $row["softPhoneID"] . "'>" . $row["sipUser"] . "  </option>";
					}
				} 
				mysqli_close($conn);
			?>	
		</select>
	</div>
	<h2>Main Radio</h2>
	<div class="ctrlinfodiv">
		<input type="text" value="Channel Type"  disabled/>
		<input type="text" placeholder="TxRx Mode" disabled name="mainTrxMode" id="mainTrxMode" value=""/>
		<input type="text" value="Frequency" disabled/>
		<input type="text" placeholder="Frequency" disabled name="mainRadioFrequency" id="mainRadioFrequency" value=""/>
	</div>
	<div class="ctrlinfodiv">
		<input type="text" value="RF Power"  disabled/>
		<input type="text" placeholder="RF Power" disabled name="mainTxPower" id="mainTxPower" value=""/>
		<input type="text" value="SQL Level" disabled/>
		<input type="text" placeholder="SQL Level" disabled name="mainSqlLevel" id="mainSqlLevel" value=""/>
	</div>
	<div class="ctrlinfodiv">
		<input type="text" value="Tx-Rx Status"  disabled/>
		<input type="text" id="mainTrxStatus" name="mainTrxStatus" placeholder="Tx-Rx"  disabled/>
	</div>
	<div class="ctrlinfodiv">
		<h4></h4>
		<h4></h4>
	</div>
	<div class="ctrlinfodiv">
		<input type="text" id="radio1" name="radio1" value="Main Radio Tx Info"  disabled/>
		<input type="text" id="radio1uri" name="radio1uri" placeholder="URI"  disabled/>
	</div>
	<div class="ctrlinfodiv">
		<input type="text" id="radio1Connection" value="Connection"  disabled/>
		<input type="text" id="radio1ConnStatus" name="radio1ConnStatus" placeholder="Connection Status"  disabled/>
		<input type="text" id="radio1ConnectionDuration" value="Duration"  disabled/>
		<input type="text" id="radio1ConnDuradio" name="radio1ConnDuradio" placeholder="Connection Duration"  disabled/>
	</div>
	<div class="ctrlinfodiv">
		<input type="text" id="radio1StatusLabel" value="Radio Status"  disabled/>
		<input type="text" id="radio1Status" name="radio1Status" placeholder="Radio Status"  disabled/>
	</div>
	<div class="ctrlinfodiv">
		<h4></h4>
		<h4></h4>
	</div>
	<div class="ctrlinfodiv">
		<input type="text" id="radio2" name="radio2" value="Main Radio Rx Info"  disabled/>
		<input type="text" id="radio2uri" name="radio2uri" placeholder="URI"  disabled/>
	</div>
	<div class="ctrlinfodiv">
		<input type="text" id="radio2Connection" value="Connection"  disabled/>
		<input type="text" id="radio2ConnStatus" name="radio2ConnStatus" placeholder="Connection Status"  disabled/>
		<input type="text" id="radio2ConnectionDuration" value="Duration"  disabled/>
		<input type="text" id="radio2ConnDuradio" name="radio2ConnDuradio" placeholder="Connection Duration"  disabled/>
	</div>
	<div class="ctrlinfodiv">
		<input type="text" id="radio2StatusLabel" value="Radio Status"  disabled/>
		<input type="text" id="radio2Status" name="radio2Status" placeholder="Radio Status"  disabled/>
	</div>
	<div id="standbyRadio">	
		<div class="ctrlinfodiv">
			<h2>Standby Radio</h2>
			<h4></h4>
		</div>
		<div class="ctrlinfodiv">
			<input type="text" value="Channel Type"  disabled/>
			<input type="text" placeholder="TxRx Mode" disabled name="standbyTrxMode" id="standbyTrxMode" value=""/>
			<input type="text" value="Frequency" disabled/>
			<input type="text" placeholder="Frequency" disabled name="standbyRadioFrequency" id="standbyRadioFrequency" value=""/>
		</div>
		<div class="ctrlinfodiv">
			<input type="text" value="RF Power"  disabled/>
			<input type="text" placeholder="RF Power" disabled name="standbyTxPower" id="standbyTxPower" value=""/>
			<input type="text" value="SQL Level" disabled/>
			<input type="text" placeholder="SQL Level" disabled name="standbySqlLevel" id="standbySqlLevel" value=""/>
		</div>
		<div class="ctrlinfodiv">
			<input type="text" value="Tx-Rx Status"  disabled/>
			<input type="text" id="standbyTrxStatus" name="standbyTrxStatus" placeholder="Tx-Rx"  disabled/>
		</div>
		
		<div class="ctrlinfodiv">		
			<h4></h4>
			<h4></h4>
		</div>
		<div class="ctrlinfodiv">
			<input type="text" id="radio3" name="radio3" value="standby Radio Tx Info"  disabled/>
			<input type="text" id="radio3uri" name="radio3uri" placeholder="URI"  disabled/>
		</div>
		<div class="ctrlinfodiv">
			<input type="text" id="radio3Connection" value="Connection"  disabled/>
			<input type="text" id="radio3ConnStatus" name="radio3ConnStatus" placeholder="Connection Status"  disabled/>
			<input type="text" id="radio3ConnectionDuration" value="Duration"  disabled/>
			<input type="text" id="radio3ConnDuradio" name="radio3ConnDuradio" placeholder="Connection Duration"  disabled/>
		</div>
		<div class="ctrlinfodiv">
			<input type="text" id="radio3StatusLabel" value="Radio Status"  disabled/>
			<input type="text" id="radio3Status" name="radio3Status" placeholder="Radio Status"  disabled/>
		</div>
		<div class="ctrlinfodiv">
			<h4></h4>
			<h4></h4>
		</div>
		<div class="ctrlinfodiv">
			<input type="text" id="radio4" name="radio4" value="standby Radio Rx Info"  disabled/>
			<input type="text" id="radio4uri" name="radio4uri" placeholder="URI"  disabled/>
		</div>
		<div class="ctrlinfodiv">
			<input type="text" id="radio4Connection" value="Connection"  disabled/>
			<input type="text" id="radio4ConnStatus" name="radio4ConnStatus" placeholder="Connection Status"  disabled/>
			<input type="text" id="radio4ConnectionDuration" value="Duration"  disabled/>
			<input type="text" id="radio4ConnDuradio" name="radio4ConnDuradio" placeholder="Connection Duration"  disabled/>
		</div>
		<div class="ctrlinfodiv">
			<input type="text" id="radio4StatusLabel" value="Radio Status"  disabled/>
			<input type="text" id="radio4Status" name="radio4Status" placeholder="Radio Status"  disabled/>
		</div>
	</div>
</div>
</div>

<div id="footer">IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.</div>
</body>
</html>
