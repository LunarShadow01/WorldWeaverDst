local function SendData(data)
    print(string.format("WorldWeaverData=%s", json.encode(data)))
end

local function GetCurPlayers()
  return math.max(0, #TheNet:GetClientTable() - 1)
end

local function GetMaxPlayers()
  return TheNet:GetDefaultMaxPlayers() or "?"
end

local function GetNumPlayers()
    return math.max(0, #TheNet:GetClientTable() - 1) .." / ".. (TheNet:GetDefaultMaxPlayers() or "?")
end

local function GetSeason()
    return STRINGS.UI.SERVERLISTINGSCREEN.SEASONS[string.upper(TheWorld.state.season)] or "?"
end

local function GetCurrentDay()
    return TheWorld.state.cycles + 1
end

local function SendInitialData()
    SendData({
        cur_players = 0,
        max_players = GetMaxPlayers(),
        season = GetSeason(),
        day = GetCurrentDay(),
    })
end

local function OnPlayerCountChanged(world, data)
    -- SendData({ players = GetNumPlayers() })
    SendData({ cur_players = GetCurPlayers() })
end

local function OnSeasonChanged(world, season)
    SendData({ season = GetSeason() })
end

local function OnDayChanged(world, cycles)
    SendData({ day = GetCurrentDay() })
end

if not TheWorld._world_weaver then
    TheWorld:ListenForEvent("ms_playercounts", OnPlayerCountChanged)
    TheWorld:WatchWorldState("cycles", OnDayChanged)
    TheWorld:WatchWorldState("season", OnSeasonChanged)

    -- Events are no longer triggered when the game auto-pauses.
    local _OnSimPaused = OnSimPaused
    function OnSimPaused(...) OnPlayerCountChanged() return _OnSimPaused(...) end

    TheWorld._world_weaver = true
end

WorldWeaver_GetServerStats = SendInitialData

SendInitialData()