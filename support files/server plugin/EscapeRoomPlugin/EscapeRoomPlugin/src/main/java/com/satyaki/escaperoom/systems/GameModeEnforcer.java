package com.satyaki.escaperoom.systems;

import org.bukkit.Bukkit;
import org.bukkit.GameMode;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;

public class GameModeEnforcer {

    public static void start(Plugin plugin) {

        Bukkit.getScheduler().runTaskTimer(plugin, () -> {

            for (Player player : Bukkit.getOnlinePlayers()) {

                if (player.isOp()) continue;

                if (player.getGameMode() != GameMode.ADVENTURE) {
                    player.setGameMode(GameMode.ADVENTURE);
                    player.sendMessage("§cGame mode locked to ADVENTURE!");
                }
            }

        }, 0L, 100L); // every 5 seconds
    }
}