var CU = CU || {};
var kb = {};

CU.KillBoard = (function ()
{
    function KB()
    {
        this.startDate = this.sampleStartDate;
        this.endDate = this.sampleEndDate;
        this.killers = {};
    };
    
    KB.prototype.apiUrl = "http://chat.camelotunchained.com:8000/api/kills";
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
        $("#error").hide();
        $.ajax({
            method: 'GET',
            url: this.apiUrl + "?start=" + this.startDate.toISOString(),
            dataType: 'json'
        }).done($.proxy(function(data) {
            this.receiveIncomingData(data);
            $("#loader").fadeOut();
            this.displayData();
        }, this)).fail($.proxy(function(jqXHR, textStatus, errorThrown) {
            $("#loader").hide();
            $("#error").show();
        }, this));
    };
    
    KB.prototype.receiveIncomingData = function (killData)
    {
        var name;
        
        for (var index = 0; index < killData.length; index++)
        {
            kill = killData[index];
            
            if (kill.victim && kill.victim.name)
            {
                name = kill.victim.name;
                
                if (!this.killers[name])
                {
                    this.killers[name] = new CU.Killer(name, kill.victim.faction, kill.victim.race);
                }
                
                this.killers[name].deaths++;
            }
            
            //don't tally a kill if the victim killed theirself
            if (kill.killer && kill.killer.name && (!kill.victim || !kill.victim.name || kill.victim.name != kill.killer.name))
            {
                name = kill.killer.name;
                
                if (!this.killers[name])
                {
                    this.killers[name] = new CU.Killer(name, kill.killer.faction, kill.killer.race);
                }
                
                this.killers[name].kills++;
            }
        }
    };
    
    KB.prototype.displayData = function ()
    {
        var tableBody = $("#killsGrid > tbody:last");
        var key;
        for (key in this.killers)
        {
            if (!this.killers.hasOwnProperty(key))
            {
                continue;
            }
         
            var killer = this.killers[key];
            
            if (!killer)
            {
                continue;
            }
         
         
         
            var row = document.createElement("tr");
            var rowHtml = "<td>" + killer.name + "</td>";
            rowHtml += "<td>" + killer.race + "</td>";
            rowHtml += "<td>" + killer.kills + "</td>";
            
            var kd = killer.killDeathRatio();
            if (kd === Number.POSITIVE_INFINITY)
            {
                kd = "&infin;";
            }
            else
            {
                kd = +kd.toFixed(2);
            }
            
            rowHtml += "<td>" + kd + "</td>";
            
            if (killer.faction == CU.Factions.Arthurian)
            {
                $(row).addClass("Arthurian");
            }
            else if (killer.faction == CU.Factions.TDD)
            {
                $(row).addClass("TDD");
            }
            else if (killer.faction == CU.Factions.Viking)
            {
                $(row).addClass("Viking");
            }
            
            $(tableBody).append(row);
            $(row).append(rowHtml);
            
        }
        
    };
    
    return KB;
})();

CU.Killer = (function ()
{
    function Killer(name, faction, race)
    {
        this.name = name;
        this.kills = 0;
        this.deaths = 0;
        
        faction = faction.toString().toLowerCase();
        if (faction == 3 || faction == "authurian")
        {
            this.faction = CU.Factions.Arthurian;
        }
        else if (faction == 1 || faction == "tdd")
        {
            this.faction = CU.Factions.TDD;
        }
        else if (faction == 2 || faction == "viking")
        {
            this.faction = CU.Factions.Viking;
        }
        else
        {
            this.faction = faction;
        }
        
        //todo race
        this.race = "tbd";
        
    };
    
    Killer.prototype.killDeathRatio = function ()
    {
        if (this.kills == 0)
        {
            return 0;
        }
        
        if (this.deaths == 0)
        {
            return Number.POSITIVE_INFINITY;
        }
        
        return this.kills / this.deaths;
    };
    
    return Killer;
})();

CU.Factions = 
{
    Arthurian: "Arthurian",
    TDD: "TDD",
    Viking: "Viking"
};
if ((typeof Object.freeze) === "function") Object.freeze(CU.Factions);

$(function() {
    kb = new CU.KillBoard();
    kb.init();
});