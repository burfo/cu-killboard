var CU = CU || {};
var kb = {};

CU.KillBoard = (function ()
{
    function KB()
    {
        this.startDate = this.sampleStartDate;
        this.endDate = this.sampleEndDate;
    };
    
    KB.prototype.apiUrl = "http://chat.camelotunchained.com:8000/api/killsi";
    KB.prototype.sampleStartDate = new Date('2014-07-17T21:45:00.000Z');
    KB.prototype.sampleEndDate = new Date('2014-07-17T22:15:00.000Z');
    
    KB.prototype.init = function ()
    {
        $("#errorRetry").click($.proxy(function()
        {
            this.initialLoad();
        }, this));
        this.initialLoad();
        
    };
    
    KB.prototype.initialLoad = function ()
    {
        $("#loader").show();
        $.ajax({
            method: 'GET',
            url: this.apiUrl + "?start=" + this.startDate.toISOString(),
            crossDomain: true,
            dataType: 'json'
        }).done(function(data) {
            $("#loader").fadeOut();
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $("#loader").hide();
            $("#error").show();
        });
    };
    
    return KB;
})();


$(function() {
    kb = new CU.KillBoard;
    kb.init();
});