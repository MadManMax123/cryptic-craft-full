package com.satyaki.escaperoom.commands;

import com.satyaki.escaperoom.listeners.ChestListener;
import org.bukkit.command.*;
import org.bukkit.entity.Player;

public class RefillCommand implements CommandExecutor {

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {

        if (!(sender instanceof Player player)) return true;

        if (!player.isOp()) {
            player.sendMessage("No permission");
            return true;
        }

        player.getInventory().addItem(ChestListener.getWand());
        player.sendMessage("§aYou got the refill wand!");

        return true;
    }
}