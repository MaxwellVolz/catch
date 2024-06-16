

Get-Content '.\game-client\src\index.js','.\game-client\src\components\player.js','.\game-client\src\utils\initEnvironment.js','.\game-client\src\utils\networking.js','.\game-server\src\server.js', '.\game-client\src\utils\eventHandlers.js' | Out-File all_scripts.js





completed throw tracking

we need a way to track consecutive throws being made that are caught by another player

When a "catch" is made the number should appear in the scene between the throw and the catch location

catches should be tracked like this

1. player1 throws and player2 catches
    1. a 1 is displayed between throw_location and catch_location
2. player2 throws and player1 catches
    1. a 2 is displayed between throw_location and catch_location

if a player catches his own throw the counter is preserved

if the ball touches the ground the player that threw the ball has his counter set to 0

1. player1 throws and player2 catches
    1. a 1 is displayed between throw_location and catch_location
2. player2 throws and player1 catches
    1. a 2 is displayed between throw_location and catch_location
1. player1 throws and player2 does not catch
   1. player1 counter=0, player2 counter = 2
2. player2 throws and player1 catches
    1. a 3 is displayed between throw_location and catch_location
    1. player1 counter=3, player2 counter = 3


2. player2 throws and player1 catches
3. 
 4. 