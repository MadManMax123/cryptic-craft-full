package com.satyaki.coderewards;

import org.bukkit.ChatColor;
import org.bukkit.entity.Player;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;

public class UseCodeCommand implements CommandExecutor {

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {

        if (!(sender instanceof Player player)) return true;

        CodeGUI.open(player);
        player.sendMessage(ChatColor.GREEN + "Click the item and type your code in chat!");

        return true;
    }
}