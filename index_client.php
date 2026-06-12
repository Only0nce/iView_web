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
include('ListAudioGain.php')
?>
<html>
<head>
  <title>IFZ ED137 Converter</title>
  <meta name="description" content="4 Wire to ED-137 Converter" />
  <meta name="keywords" content="ED137, SIP" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionIndexClient.js"></script>
  <script type = "text/javascript">
	  
  </script>
</head>

<body>
<div id="header">
  <div id="logo">
	<div id="logo_text">
      <!-- class="logo_colour", allows you to change the colour of the text -->
      <h1><a href="index.php"><span class="logo_colour">IFZ ED137 to 4-Wires  Converter</span></a></h1>
      <!--          <h2>IFZ Technologies Co.,Ltd.</h2>-->
    </div>
  </div>
  <div id="menubar">
	<ul id="menu">
		<li class="selected"><a href="index.php">Home</a></li>
		<li><a href="network.php">Network</a></li>
		<li><a href="update.php">SYSTEM</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASSWORD</a></li>
	</ul>
  </div>
</div>
  <div id="site_content">
      <div class="sidebar">
        <h3>Host Configuration</h3>
	<h4 align="left">HW Mode</h4>
	  <form method="post" action="">
		<div class="sampleselected">
		  <select name="modeIndex"  class="sampleselected" id="modeIndex">
        		<option class='selectedlt' selected value='0'>Select option</option>
				<option class='selectedlt' value='1'>4 wires to ED137</option>
				<option class='selectedlt' value='2'>ED137 to 4 wires</option>
	  	  </select>
	    </div><br><br>
		<div class="sidebardiv">
			<button class="samplebutton" type="submit" id="hwmode" name="hwmode" onClick="updateswitchInviteMode() ;">Apply</button>
		</div>
	  </form>
        <span class="sidebardiv">
			<h4>SIP User</h4>
        	<input class="sampleselected" type="text" id="localname" name="localname"  value='<?php echo $localname; ?>'/>
        </span>
		
        <span class="sidebardiv">
			<h4>Keep Alive Period (msec)</h4>
        	<input class="sampleselected" type="number" id="keepaliveperoid" name="keepaliveperoid"  min="200" max="1000" value='<?php echo $keepaliveperoid; ?>'/>
        </span>
		
        <span class="sidebardiv">
			<h4>SIP Port</h4>
        	<input class="sampleselected" type="number" id="hostSipPort" name="hostSipPort" min="0" max="65535"  value='<?php echo $hostSipPort; ?>'/>
        </span>
		<p>

		<div class="sidebardiv">
		<button class="samplebutton" type="submit" id="hostupdate" name="hostupdate" onClick="updateHostCfg()" ;>Update</button>
	    </div>
		</p>
        
		<span class="sidebardiv">
			<h4>Audio Input Level</h4>
		  	<select  class="sampleselected" id="inputgain" name="inputgain" onChange="updateInputgain()">
        	<?php
			  $gainAudioInID = 0;
        		foreach ($gainAudioIn as $row) {
					echo "<option class='selectedlt' value='" . $gainAudioInID . "'>" . $row . "</option>";
					$gainAudioInID+=1;
    			}
		  	?>		  		  
	  	  </select>
	    </span>
		
		  <span class="sidebardiv">
			<h4>Output Audio Level</h4>
		    <select  class="sampleselected" id="outputgain" name="outputgain" onChange="updateOutputgain()">
		      <?php
				$gainAudioOutID = 0;
        		foreach ($gainAudioOut as $row) {
					echo "<option class='selectedlt' value='" . $gainAudioOutID . "'>" . $row . "</option>";
					$gainAudioOutID+=1;
    			}
		  	?>
	        </select>
		  </span>
        
		  <span class="sidebardiv">
			<h4>I/O Interface</h4>
		  	<select  class="sampleselected" id="portInterface" name="portInterface" onChange="updatePortInterface()">
        	<?php
			  $audioInterfaceID = 0;
        		foreach ($audioInterface as $row) {
					echo "<option class='selectedlt' value='" . $audioInterfaceID . "'>" . $row . "</option>";
					$audioInterfaceID+=1;
    			}
		  	?>		  		  
	  	  </select>
	    </span>
		
	
		<h4 align="left">System Time</h4>
		<div class="sidebardiv"> <span style="float: left">Local Date </span><br>
			<input class="sampleselected" type="text" id="currentDate" name="currentDate"  value='' disabled/>
		</div>
		<div class="sidebardiv"> <span style="float: left">Local Time </span><br>
			<input class="sampleselected" type="text" id="currentTime" name="currentTime"  value='' disabled/>
		</div>
		<h4 align="left">System</h4>
	  	<form method="post" action="">
		<div class="sampleselected">
		  <select name="systemcommamd"  class="systemselect" id="systemcommamd">
        		<option class='selectedlt' selected value='0'>Select option</option>
				<option class='selectedlt' value='1'>System Reboot</option>
				<option class='selectedlt' value='2'>Shutdown</option>
			  	<option class='selectedlt' value='3'>Restart Softphone</option>
	  	  </select>
	    </div><br><br>
		<div class="sidebardiv">
			<button class="samplebutton" type="submit" id="system" name="system";>Apply</button>
		</div>
	  	</form>
	  <p></p>
      </div>
	

      <div id="content">
        <h3>Allowed URI List </h3>
		  <div class="selected_list"> <span> Number connections </span>
		  <input class="textedited" type="number" id="allowConnNum" name="allowConnNum" value='0' max="8" min="0" />
	    </div>
		<div class="selected_list"> <span> URI 1</span>
		  <input class="textedited" type="text" id="uriList1" name="uriList1" value='' />
	    </div>
		<div class="selected_list"> <span> URI 2</span>
		  <input class="textedited" type="text" id="uriList2" name="uriList2" value='' />
	    </div>
		<div class="selected_list"> <span> URI 3</span>
		  <input class="textedited" type="text" id="uriList3" name="uriList3" value='' />
	    </div>
		<div class="selected_list"> <span> URI 4</span>
		  <input class="textedited" type="text" id="uriList4" name="uriList4" value='' />
	    </div>
		<div class="selected_list"> <span> URI 5</span>
		  <input class="textedited" type="text" id="uriList5" name="uriList5" value='' />
	    </div>
		<div class="selected_list"> <span> URI 6</span>
		  <input class="textedited" type="text" id="uriList6" name="uriList6" value='' />
	    </div>
		<div class="selected_list"> <span> URI 7</span>
		  <input class="textedited" type="text" id="uriList7" name="uriList7" value='' />
	    </div>
		<div class="selected_list"> <span> URI 8</span>
		  <input class="textedited" type="text" id="uriList8" name="uriList8" value='' />
	    </div>
		<div class="selected_list"><span></span>
			<button class="startstream" type="submit" id="updateurilits" name="updateurilits" onClick="updateURILits()" ;>Update URI List</button>
		</div>
	  </div>

	<div class="sidebar2">
	  
	  <h3 align="right"> Status</h3>
	  <div class="systemdiv"> <span style="float: right">Connected number</span><br>
			<input class="textedited" type="text" id="connNum" name="connNum"  value='' disabled/>
      </div>
	  <div class="systemdiv"> <span  style="float: right">Tx - Rx</span><br>
		  <input class="textedited" type="text" id="TxRx" name="TxRx"  value='' disabled/>
	  </div>
		<div class="systemdiv"> <span  style="float: right">Last PTT </span><br>
		  <input class="textedited" type="text" id="pttURI" name="pttURI"  value='' disabled/>
	  </div>
	  <p>&nbsp; </p>
		<h4 align="right"> URI Connected</h4>
		<div class="systemdiv">
		  <select name="uriConnList"  class="systemselect" id="uriConnList">
	  	  </select>
	  </div>

	  <div class="systemdiv"> <span style="float: right">Duration</span><br>
			<input class="textedited" type="text" id="connDuration" name="connDuration"  value='' disabled/>
      </div>
	<div class="systemdiv">
		<button class="systembutton" type="submit" id="disconnect" name="disconnect" onClick="disconnect()";>Disconnect</button>
	</div>
    </div>
    
  </div>

<div id="footer">
      IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.
</div>
</body>
</html>
