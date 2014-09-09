var CU = CU || {};
var kb = {};

CU.KillBoard = (function ()
{
    function KB()
    {
        this.startDate = "";
        this.endDate = "";
        this.listQtyLimit = 20;
    };
    
    KB.prototype.apiUrl = "http://chat.camelotunchained.com:8000/api/kills";
    KB.prototype.sampleStartDate = new Date('2014-09-05T04:30:00.000Z');
    KB.prototype.sampleEndDate = new Date('2014-09-06T04:30:00.000Z');
    
    KB.prototype.init = function ()
    {
        $("#errorRetry").click($.proxy(function ()
        {
            this.initialLoad();
        }, this));
        
        $("#btnKills").click($.proxy(function ()
        {
            $("#killsGrid").show();
            $("#deathsGrid").hide();
            $("#kdGrid").hide();
        }, this));
        
        $("#btnDeaths").click($.proxy(function ()
        {
            $("#deathsGrid").show();
            $("#killsGrid").hide();
            $("#kdGrid").hide();
        }, this));
        
        $("#btnKD").click($.proxy(function ()
        {
            $("#kdGrid").show();
            $("#deathsGrid").hide();
            $("#killsGrid").hide();
        }, this));
        
        $("#buttons").buttonset();
        
        
        this.initialLoad();
        $("#btnKills").click().tooltip({content: "test" });
    };
    
    KB.prototype.initialLoad = function ()
    {
        $("#allData").hide();
        $("#error").hide();
        $("#loader").show();
        this.refreshData();
    };
    
    KB.prototype.refreshData = function ()
    {
        $.ajax({
            method: 'GET',
            url: this.apiUrl + (this.startDate ? "?start=" + this.startDate.toISOString() : ""),
            dataType: 'json'
        }).done($.proxy(function(data) {
            var allData = this.receiveIncomingData(data);
            this.displayData(allData);
            $("#loader").fadeOut();
            window.setTimeout($.proxy(this.refreshData, this), 60000);
        }, this)).fail($.proxy(function(jqXHR, textStatus, errorThrown) {
            $("#loader").hide();
            $("#error").show();
        }, this));
    };
    
    KB.prototype.receiveIncomingData = function (killData)
    {
        var name;
        var killers = {};
        var killersAry = [];
        
        for (var index = 0; index < killData.length; index++)
        {
            kill = killData[index];
            
            if (kill.victim && kill.victim.name)
            {
                name = kill.victim.name;
                
                if (!killers[name])
                {
                    killers[name] = new CU.Killer(name, kill.victim.faction);
                }
                
                killers[name].deaths++;
            }
            
            //don't tally a kill if the victim killed theirself
            if (kill.killer && kill.killer.name && (!kill.victim || !kill.victim.name || kill.victim.name != kill.killer.name))
            {
                name = kill.killer.name;
                
                if (!killers[name])
                {
                    killers[name] = new CU.Killer(name, kill.killer.faction);
                }
                
                killers[name].kills++;
            }
        }
        
        for (key in killers)
        {
            if (!killers.hasOwnProperty(key))
            {
                continue;
            }
            
            killersAry.push(killers[key]);
        }
        
        return killersAry;
    };
    
    KB.prototype.displayData = function (killers)
    {
        
        /** Kills **/
        var tableBody = $("#killsGrid > tbody:last");
        tableBody.empty();
        var killsEntries = killers.sort(function (a,b)
        {
            return b.kills - a.kills;
        }).slice(0, this.listQtyLimit);
        
        for (var idx = 0; idx < killsEntries.length; idx++)
        {
            var killer = killsEntries[idx];
            var row = document.createElement("tr");
            $(tableBody).append(row);
            row = $(row);
            row.append(document.createElement("td"));
            var name = CU.truncateString(killer.name);
            row.append($(document.createElement("td")).text(name));
            row.append($(document.createElement("td")).text(killer.kills));
            row.addClass(killer.faction);
            row.tooltip(
            {
                content: this.killerTooltip(killer),
                items: "tr",
                track: true
            });
        }
        
        /** K/D **/
        tableBody = $("#kdGrid > tbody:last");
        tableBody.empty();
        var kdEntries = killers.sort(function (a,b)
        {
            var comp = b.killDeathRatio() - a.killDeathRatio();
            //if k/d is equal, secondary sort on # kills
            if (comp === 0)
            {
                comp = b.kills - a.kills;
            }
            return comp;
        }).slice(0, this.listQtyLimit);
        
        for (var idx = 0; idx < kdEntries.length; idx++)
        {
            var killer = kdEntries[idx];
            var row = document.createElement("tr");
            $(tableBody).append(row);
            row = $(row);
            row.append(document.createElement("td"));
            row.append($(document.createElement("td")).text(CU.truncateString(killer.name)));
            var kdDisplay = +killer.killDeathRatio().toFixed(2);
            row.append($(document.createElement("td")).text(kdDisplay));
            row.addClass(killer.faction);
            row.tooltip(
            {
                content: this.killerTooltip(killer),
                items: "tr",
                track: true
            });
        }
        
        /** Deaths **/
        var tableBody = $("#deathsGrid > tbody:last");
        tableBody.empty();
        var killsEntries = killers.sort(function (a,b)
        {
            return b.deaths - a.deaths;
        }).slice(0, this.listQtyLimit);
        
        for (var idx = 0; idx < killsEntries.length; idx++)
        {
            var killer = killsEntries[idx];
            var row = document.createElement("tr");
            $(tableBody).append(row);
            row = $(row);
            row.append(document.createElement("td"));
            row.append($(document.createElement("td")).text(CU.truncateString(killer.name)));
            row.append($(document.createElement("td")).text(killer.deaths));
            row.addClass(killer.faction);
            row.tooltip(
            {
                content: this.killerTooltip(killer),
                items: "tr",
                track: true
            });
        }
        
        $("#allData").show();
    };
    
    KB.prototype.killerTooltip = function (killer)
    {
        return "<b>" + CU.truncateString(killer.name) + "</b><br />Kills: " + killer.kills + "<br />Deaths: " + killer.deaths + "<br />K/D: " + (+killer.killDeathRatio().toFixed(2)) + "<br />" + killer.faction;
    };
    
    return KB;
})();

CU.Killer = (function ()
{
    function Killer(name, faction)
    {
        this.name = name;
        this.kills = 0;
        this.deaths = 0;
        
        if (faction == 3) this.faction = CU.Factions.Arthurian;
        else if (faction == 1) this.faction = CU.Factions.TDD;
        else if (faction == 2) this.faction = CU.Factions.Viking;
        else this.faction = CU.Factions.Factionless;
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
    Viking: "Viking",
    Factionless: "Factionless"
};
if ((typeof Object.freeze) === "function") Object.freeze(CU.Factions);

CU.truncateString = function (str, len)
{
    return str.length > len ? str.substring(0, len - 1) + "&infin;" : str;
};

$(function() {
    kb = new CU.KillBoard();
    kb.init();
});