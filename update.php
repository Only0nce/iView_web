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
	$webversion = "16042026-V1.0";
	require_once __DIR__ . '/hardware_features.php';
?>
<!DOCTYPE HTML>
<?php
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');
ini_set('max_input_time', 300);
ini_set('max_execution_time', 300);
include('dbConfig.php');
include('timezone.php')
?>
	
<html>
<head>
  <title>iView</title>
  <meta name="description" content="Professional Audio Streamer" />
  <meta name="keywords" content="Audio Streamer, Music Streamer" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionSystem.js?v=<?php echo time(); ?>"></script>
  <link rel="stylesheet" type="text/css" href="jquery.datetimepicker.css">
  <script type="text/javascript" src="jquery.js"></script>
  <script type="text/javascript" src="jquery.datetimepicker.js"></script>
  <style type="text/css">
/*
  .selected_list {
}
*/
  </style>
</head>
</style>

<body>
  <div id="main">
    <div id="header">
      <div id="logo">
        <div id="logo_text">
          <!-- class="logo_colour", allows you to change the colour of the text -->
          <h1><a href="index.php"><span class="logo_colour">RF Power Sensor Monitoring System</span></a></h1>
<!--          <h2>IFZ Technologies Co.,Ltd.</h2>-->
        </div>
      </div>
      <div id="menubar">
        <ul id="menu">
			<li><a href="index.php">HOME</a></li>
			<li><a href="datalogger.php">LOG</a></li>
			<li><a href="cal.php?id=1">CAL</a></li>
			<li><a href="thrulan.php?id=0">Power Sensor</a></li>
			<li><a href="snmp_update.php">Rx SNMP Info</a></li>
    		<li><a href="role.php?id=0">ROLE</a></li>
			<li><a href="network.php">NETWORK</a></li>
                <?php echo iview_render_wifi_menu_item(false); ?>
<li class="selected"><a href="update.php">SYSTEM</a></li>
			<li><a href="logout.php">LOGOUT</a></li>
			<li><a href="changepass.php">CHANGE PASS.</a></li>
        </ul>
      </div>
    </div>
    <div id="site_content">
      <div class="sidebar">
		<h3 align="left">System</h3>
		<form method="post" action="">
		<div class="sampleselected">
		  <select name="systemcommamd"  class="systemselect" id="systemcommamd">
        		<option class='selectedlt' selected value='0'>Select option</option>
<!--				<option class='selectedlt' value='1'>Start Update</option>-->
				<option class='selectedlt' value='1'>System Reboot</option>

	  	  </select>
		  </div><br><br>
		<div class="systemdiv">
			<button class="button button2" type="submit" id="system" name="system";>Apply</button>
		</div>
		</form>
		<h3 align="left">Hardware Info&nbsp;</h3>
		<div class="form-group">
		<div class="systemdiv"> <span style="float: left">Hardware</span><br>
			<input class="form-control" type="text" id="hwversion" name="hwversion" disabled/>
	    </div>
		<div class="systemdiv"> <span  style="float: left">Sorfware</span><br>
			<input class="form-control" type="text" id="swversion" name="swversion"  disabled/>
	    </div>
		<div class="systemdiv"> <span  style="float: left">Web</span><br>
			<?php
				echo '<input class="form-control" type="text" id="webversion" name="webversion"  value="'.$webversion.'" disabled/>';
			?>
	    </div>
	    </div>
		<h4 align="left">System Time</h4>
		<div class="form-group">
		<div class="systemdiv"> <span style="float: left">Local Date </span><br>
			<input class="form-control" type="text" id="currentDate" name="currentDate"  value='' disabled/>
   	  	</div>
		<div class="systemdiv"> <span style="float: left">Local Time </span><br>
			<input class="form-control" type="text" id="currentTime" name="currentTime"  value='' disabled/>
   	  </div>
   	  </div>
    </div>
      <div id="network_content">
        <!-- insert the page content here -->
        <h3 align="center">Update</h3>
		<?php
		  if(isset($_POST['system'])){    
			  $command = $_POST['systemcommamd'];
			  if ($command == '1'){
				  echo '<script language="javascript">';
				  echo "alert('Syetem will be reboot.')";
				  echo '</script>';
				  system("sudo reboot");
			  }
			  
		   }
		  if(isset($_FILES['fileToUpload'])){
				$target_dir = "uploads/";
				$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
				$uploadOk = 1;
				$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));
//				echo '<script language="javascript">';
//				echo "alert('The file ". $_FILES["fileToUpload"]["name"] . " has been uploaded.')";
//				echo '</script>';
			  	$check = getimagesize($_FILES["fileToUpload"]["tmp_name"]);
//				if($check !== false) {
//					echo '<script language="javascript">';
//					echo "alert('File is ok')";
//					echo '</script>';
//					$uploadOk = 1;
//				} else {
//					echo '<script language="javascript">';
//					echo "alert('File is not ok')";
//					echo '</script>';
//					$uploadOk = 0;
//				}
				if ($_FILES["fileToUpload"]["size"] > 50000000) {
					echo '<script language="javascript">';
					echo "alert('Sorry, your file is too large.')";
					echo '</script>';
					$uploadOk = 0;
				}
				// Allow certain file formats
				if($imageFileType != "bin") {
					echo '<script language="javascript">';
					echo "alert('Sorry, only update.bin files are allowed.')";
					echo '</script>';
					$uploadOk = 0;
				}
				// Check if $uploadOk is set to 0 by an error
				if ($uploadOk == 0) {
					echo '<script language="javascript">';
					echo "alert('Sorry, your file was not uploaded.')";
					echo '</script>';
				// if everything is ok, try to upload file
				}else {
					$movefile = move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], 'uploads/update.tar');
					if ($movefile) {
//						echo "The file ". basename( $_FILES["fileToUpload"]["name"]). " has been uploaded.";
						echo '<script language="javascript">';
						echo "alert('The file ". basename( $_FILES["fileToUpload"]["name"]). " has been uploaded.')";
						echo '</script>';
						
//						echo '<script language="javascript">';
//						echo 'systemupdate();';
//						echo '</script>';
						
					} else {
						echo '<script language="javascript">';
						echo "alert('Sorry, there was an error uploading your file.')";
						echo '</script>';
					}
				}
		  }
		  ?>
	
		<form action="" method="post" enctype="multipart/form-data" >
		<div class="selected_list"> <span>Resource</span>
			<input class="form-control" type="file" name="fileToUpload"/>
	    </div>
		<div class="selected_list"><span></span>
			<button class="button button2" type="submit">Upload File</button>
		</div>
		</form>
		<div class="selected_list"><span></span>
			<?php
				if (file_exists('uploads/update.tar')){
					echo('<h5>Found update file, Pls update your system.</h5>');
					echo('<button class="button button2" type="submit" id="update" name="update" onClick="systemupdate()">Update System</button>');
				}
			?>
		</div>
		<?php
				echo '<div class="selected_list"><span></span>';
				echo '<h3>Date and Time setting</h3>';
				echo '</div>';
				echo '<div class="selected_list"><span>Set the time</span>';
				echo '    <select class="systemselect" name="dateTimeMethod" id="dateTimeMethod" onChange="datetimeMethod()">';
				echo '	<option class="selectedlt" value=0>Select option</option>';
				echo '	<option class="selectedlt" value=1>Automatically From NTP</option>';
				echo '	<option class="selectedlt" value=2>Manually</option>';
				echo '    </select>';
			    echo '</div>';

				echo '<div id="divManual" style="display: none">';
				echo '<div class="selected_list" ><span>Date Time</span>';
				echo '<input class="form-control"  type="text" name="startdate" value="" id="startdate" />';
				echo '</div>';
				echo '<div class="selected_list" ><span></span>';
				echo '<button class="button button2" type="submit" id="updateDateTime" name="updateDateTime" onClick="updateTime()">Setup Date Time</button>';
				echo '</div>';
				echo '</div>';
				echo '<script type="text/javascript">';
				echo "jQuery('#startdate').datetimepicker();";
				echo '</script>';
				echo '<div id="divNTP" style="display: none">';
				echo '<div class="selected_list" > <span>NTP Server</span>';
				echo '<input class="form-control" type="text" id="ntpserver1" name="ntpserver1"  value="" placeholder="ntpServer1"/>';
				echo '<input class="form-control" type="text" id="ntpserver2" name="ntpserver2"  value="" placeholder="ntpServer2"/>';
				echo '<input class="form-control" type="text" id="ntpserver3" name="ntpserver3"  value="" placeholder="ntpServer3"/>';
				echo '<input class="form-control" type="text" id="ntpserver4" name="ntpserver4"  value="" placeholder="ntpServer4"/>';
				echo '</div>';
				echo '<div class="selected_list"><span></span>';
				echo '<button class="button button2" type="submit" id="updateNTP" name="updateNTP"  onClick="updateNTPServer()">Update NTP Server</button>';
				echo '</div>';
				echo '</div>';
				echo '<div class="selected_list" > <span>Location</span>';
				echo '<select  class="systemselect" id="LocationList" name="LocationList" onChange="setLocation()" >';

				foreach ($location as $row) 
				{
					echo "<option class='selectedlt' value='" . $row . "'>" . $row . "</option>";
				}

				echo '</select>';
				echo '</div>';
		?>

	</div>
		
	<div class="sidebar2">
		
	</div>
    
  </div>
  <div id="footer">
      <h4>IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.</h4>
</div>
</body>
</html>
