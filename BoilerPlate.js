$(function() {
	$('title').html(`Task Tracker`);

	$('#Header').html(`<center><h1>Task Tracker</h1></center>`);

	let Footer = '<center>';

	if (Page != 'index') {
		Footer += '<a href="index.html" style="color: #054295; margin: 5px;"><i class="bi bi-arrow-left"></i> Back to Tracker</a>'
	};

	if (Page != 'MoreInfo') {
		Footer += '<a href="MoreInfo.html" style="color: #054295; margin: 5px;">More Info</a>'
	};

	Footer += '<a target="_blank" href="https://github.com/MattG129/TaskTracker/issues" style="color: #054295; margin: 5px;">Feedback</a>';

	$('#Footer').html(Footer);
});