package com.satyaki.escaperoom.listeners;

import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

public class JoinListener implements Listener {

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {

        Player player = event.getPlayer();

        // 🎮 Force adventure mode
        player.setGameMode(org.bukkit.GameMode.ADVENTURE);

        // 🧹 Clear inventory
        player.getInventory().clear();

        // 🛡️ Armor
        ItemStack helmet = new ItemStack(Material.IRON_HELMET);
        ItemStack chest = new ItemStack(Material.IRON_CHESTPLATE);
        ItemStack legs = new ItemStack(Material.IRON_LEGGINGS);
        ItemStack boots = new ItemStack(Material.IRON_BOOTS);

        addProt1(helmet);
        addProt1(chest);
        addProt1(legs);
        addProt1(boots);

        player.getInventory().setHelmet(helmet);
        player.getInventory().setChestplate(chest);
        player.getInventory().setLeggings(legs);
        player.getInventory().setBoots(boots);

        // ⚔️ Sword
        ItemStack sword = new ItemStack(Material.IRON_SWORD);
        ItemMeta swordMeta = sword.getItemMeta();

        swordMeta.addEnchant(Enchantment.SHARPNESS, 1, true);
        swordMeta.addEnchant(Enchantment.UNBREAKING, 1, true);

        sword.setItemMeta(swordMeta);

        // 🛡️ Shield
        ItemStack shield = new ItemStack(Material.SHIELD);
        ItemMeta shieldMeta = shield.getItemMeta();

        shieldMeta.addEnchant(Enchantment.UNBREAKING, 1, true);

        shield.setItemMeta(shieldMeta);

        // 🎒 Give items
        player.getInventory().setItem(0, sword);
        player.getInventory().setItem(1, shield);
    }

    private void addProt1(ItemStack item) {
        ItemMeta meta = item.getItemMeta();
        meta.addEnchant(Enchantment.PROTECTION, 1, true);
        item.setItemMeta(meta);
    }
}