$(function() {
    window.Parsley.addValidator('mmddyyyy', {
        validateString: function(value) {
            return moment(value, "MM/DD/YYYY").isValid() && value.length >= 8;
        },
        messages: {en: 'This value must be a valid date in mm/dd/yyyy format.'}
    });

    window.Parsley.addValidator('mintoday', {
        validateString: function(value) {
            return !moment(value, "MM/DD/YYYY").isValid() || moment(value, 'MM/DD/YYYY') >= Today;
        },
        messages: {en: 'Must be on or before today.'}
    });
});