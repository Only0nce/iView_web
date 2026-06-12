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

?>
	
<html>
<head>
  <title>IFZ Audio Streamer</title>
  <meta name="description" content="Professional Audio Streamer" />
  <meta name="keywords" content="Audio Streamer, Music Streamer" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
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
          <h1><a href="index.php"><span class="logo_colour">IFZ Professional Audio Streamer</span></a></h1>
          <h2>IFZ Technologies Co.,Ltd.</h2>
        </div>
      </div>
      <div id="menubar">
        <ul id="menu">
          <!-- put class="selected" in the li tag for the selected page - to highlight which page you're on -->
          <li><a href="index.php">Home</a></li>
		  <li><a href="network.php">Network</a></li>
		  <li class="selected"><a href="update.php">UPDATE</a></li>
		  <li><a href="logout.php">LOGOUT</a></li>
<!--
          <li><a href="examples.html">Examples</a></li>
          <li><a href="page.html">A Page</a></li>
          <li><a href="another_page.html">Another Page</a></li>
          <li><a href="contact.html">Contact Us</a></li>
-->
        </ul>
      </div>
    </div>
    <div id="site_content">
      <div class="sidebar">
        <!-- insert your sidebar items here -->
        
      </div>
      <div id="content">
        <!-- insert the page content here -->
        <h3>Update file has beed uploaded</h3>
		  <h5>Please reboot your system</h5>
		<?php
		  if(isset($_POST['reboot'])){    
			  echo '<script language="javascript">';
			  echo "alert('Syetem will be reboot.')";
			  echo '</script>';
			  system("reboot");
		   }
		  ?>
	
		<form action="" method="post">

		<div class="selected_list"><span></span>
			<button class="startstream" type="submit" name="reboot" id="reboot" >REBOOT</button>
		</div>
		</form>
		
		</div>
		

    <div id="footer">
      IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.
    </div>
  </div>
  
</body>
</html>
