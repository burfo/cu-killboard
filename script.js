var CU = CU || {};
var kb = {};

CU.KillBoard = (function ()
{
    function KillBoard()
    {
        this.startDate = "";
        this.listQtyLimit = 20;
    };
    
    KillBoard.prototype.apiUrl = "http://chat.camelotunchained.com:8000/api/kills";
    KillBoard.prototype.sampleStartDate = new Date('2014-09-05T04:30:00.000Z');
    KillBoard.prototype.sampleEndDate = new Date('2014-09-06T04:30:00.000Z');
    
    KillBoard.prototype.init = function KillBoard$init()
    {
        $.support.cors = true;  //trick it to work in IE
        
        $("#errorRetry").click($.proxy(this._initialLoad, this));
        $("#btnKills").click($.proxy(this._onBtnKillsClicked, this));
        $("#btnDeaths").click($.proxy(this._onBtnDeathsClicked, this));
        $("#btnKD").click($.proxy(this._onBtnKDClicked, this));
        
        $("#buttons").buttonset();
        
        this._initialLoad();
        $("#btnKills").click();
    };
    
    KillBoard.prototype._initialLoad = function KillBoard$_initialLoad()
    {
        $("#allData").hide();
        $("#error").hide();
        $("#loader").show();
        this._refreshData();
    };
    
    KillBoard.prototype._refreshData = function KillBoard$_refreshData()
    {
        $.ajax({
            method: 'GET',
            url: this.apiUrl + (this.startDate ? "?start=" + this.startDate.toISOString() : ""),
            dataType: 'json'
        }).done($.proxy(this._onLoadDataSuccess, this)).fail($.proxy(this._onLoadDataFail, this));
    };
    
    KillBoard.prototype._onLoadDataSuccess = function KillBoard$_onLoadDataSuccess(killData)
    {
        var name;
        var killers = {};
        var killersAry = [];
        
        for (var index = 0; index < killData.length; index++)
        {
            var kill = killData[index];
            
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
            if (kill.killer && kill.killer.name && (!kill.victim || !kill.victim.name || kill.victim.name !== kill.killer.name))
            {
                name = kill.killer.name;
                
                if (!killers[name])
                {
                    killers[name] = new CU.Killer(name, kill.killer.faction);
                }
                
                killers[name].kills++;
            }
        }
        
        for (var key in killers)
        {
            if (!killers.hasOwnProperty(key))
            {
                continue;
            }
            
            killersAry.push(killers[key]);
        }
        
        this._displayData(killersAry);
        $("#loader").fadeOut(1500);
        window.setTimeout($.proxy(this._refreshData, this), 120000);  //2 minutes
    };
    
    KillBoard.prototype._onLoadDataFail = function KillBoard$_onLoadDataFail(jqXHR, textStatus, errorThrown)
    {
        $("#loader").hide();
        $("#error").show();
        console.log("AJAX error :: '" + textStatus + "' :: " + (errorThrown ? JSON.stringify(errorThrown) : ""));
    };
    
    KillBoard.prototype._displayData = function KillBoard$_displayData(killers)
    {
    	var killer, row, name, idx;
        /** Kills **/
        var tableBody = $("#killsGrid > tbody:last");
        tableBody.empty();
        var killsEntries = killers.sort(function (a,b)
        {
            return b.kills - a.kills;
        }).slice(0, this.listQtyLimit);
        
        for (idx = 0; idx < killsEntries.length; idx++)
        {
            killer = killsEntries[idx];
            row = document.createElement("tr");
            $(tableBody).append(row);
            row = $(row);
            row.append(document.createElement("td"));
            name = this.truncateString(killer.name);
            row.append($(document.createElement("td")).text(name));
            row.append($(document.createElement("td")).text(killer.kills));
            row.addClass(killer.faction);
            row.tooltip(
            {
                content: this._killerTooltip(killer),
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
        
        for (idx = 0; idx < kdEntries.length; idx++)
        {
            killer = kdEntries[idx];
            row = document.createElement("tr");
            $(tableBody).append(row);
            row = $(row);
            row.append(document.createElement("td"));
            row.append($(document.createElement("td")).text(this.truncateString(killer.name)));
            row.append($(document.createElement("td")).text(killer.killDeathRatio(true)));
            row.addClass(killer.faction);
            row.tooltip(
            {
                content: this._killerTooltip(killer),
                items: "tr",
                track: true
            });
        }
        
        /** Deaths **/
        tableBody = $("#deathsGrid > tbody:last");
        tableBody.empty();
        var deathEntries = killers.sort(function (a,b)
        {
            return b.deaths - a.deaths;
        }).slice(0, this.listQtyLimit);
        
        for (idx = 0; idx < deathEntries.length; idx++)
        {
        	killer = deathEntries[idx];
            row = document.createElement("tr");
            $(tableBody).append(row);
            row = $(row);
            row.append(document.createElement("td"));
            row.append($(document.createElement("td")).text(this.truncateString(killer.name)));
            row.append($(document.createElement("td")).text(killer.deaths));
            row.addClass(killer.faction);
            row.tooltip(
            {
                content: this._killerTooltip(killer),
                items: "tr",
                track: true
            });
        }
        
        $("#allData").show();
    };
    
    KillBoard.prototype._killerTooltip = function KillBoard$_killerTooltip(killer)
    {
        return "<b>" + this.truncateString(killer.name) + "</b><br />Kills: " + killer.kills + "<br />Deaths: " + killer.deaths + "<br />K/D: " + killer.killDeathRatio(true) + "<br />" + killer.faction;
    };
    
    KillBoard.prototype._onBtnKillsClicked = function KillBoard$_onBtnKillsClicked()
    {
        $("#killsGrid").show();
        $("#deathsGrid").hide();
        $("#kdGrid").hide();
    };
    
    KillBoard.prototype._onBtnDeathsClicked = function KillBoard$_onBtnDeathsClicked()
    {
        $("#deathsGrid").show();
        $("#killsGrid").hide();
        $("#kdGrid").hide();
    };
    
    KillBoard.prototype._onBtnKDClicked = function KillBoard$_onBtnKDClicked()
    {
        $("#kdGrid").show();
        $("#deathsGrid").hide();
        $("#killsGrid").hide();
    };
    
    KillBoard.prototype.truncateString = function KillBoard$truncateString(str, len)
    {
        if (!len) len = 35;
        return str.length > len ? str.substring(0, len - 1) + "\u2026" : str; //aka &hellip;
    };
    
    return KillBoard;
})();

CU.Killer = (function ()
{
    function Killer(name, faction)
    {
        this.name = name;
        this.kills = 0;
        this.deaths = 0;
        
        if (faction === 3 || faction === "3") this.faction = CU.Factions.Arthurian;
        else if (faction === 1 || faction === "1") this.faction = CU.Factions.TDD;
        else if (faction === 2 || faction === "2") this.faction = CU.Factions.Viking;
        else this.faction = CU.Factions.Factionless;
    };
    
    Killer.prototype.killDeathRatio = function Killer$killDeathRatio(displayMode)
    {
        if (!this.kills)
        {
            return 0;
        }
        
        if (!this.deaths)
        {
            return displayMode ? "\u221E" : Number.POSITIVE_INFINITY; //aka &infin;
        }
        
        var kd = this.kills / this.deaths;
        return displayMode ? (+kd.toFixed(2)) : kd;
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

$(function() {
    kb = new CU.KillBoard();
    kb.init();
});