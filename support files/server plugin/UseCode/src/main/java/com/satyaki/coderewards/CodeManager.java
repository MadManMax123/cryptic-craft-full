package com.satyaki.coderewards;

import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CodeManager {

    private static final Map<String, Reward> codes = new HashMap<>();

    // 🧩 SPLIT CODE PARTS
    private static final String FULL_SPLIT = "halfofthecodeotherhalfhere";
    private static final String PART_A = "halfofthecode";
    private static final String PART_B = "otherhalfhere";

    public static void init(CodeRewardsPlugin plugin) {

        // 🌊 TELEPORT CODE
        codes.put("h7k2a", player -> {

            ItemStack wand = new ItemStack(Material.BLAZE_ROD);
            ItemMeta meta = wand.getItemMeta();

            meta.setDisplayName("§bTeleport Wand");
            meta.setLore(List.of(
                    "§7Right click to teleport",
                    "§cOne-time use"
            ));

            meta.getPersistentDataContainer().set(
                    new org.bukkit.NamespacedKey(CodeRewardsPlugin.getInstance(), "tp_wand"),
                    PersistentDataType.INTEGER,
                    1
            );

            wand.setItemMeta(meta);

            player.getInventory().addItem(wand);
            player.sendMessage("§aYou received a Teleport Wand!");
        });

        // ⚔️ NETHERITE SWORD
        codes.put("l9x8z", player -> {
            ItemStack sword = new ItemStack(Material.NETHERITE_SWORD);
            sword.addEnchantment(Enchantment.SHARPNESS, 5);
            sword.addEnchantment(Enchantment.SWEEPING_EDGE, 3);
            player.getInventory().addItem(sword);
        });

        // 💀 TROLL CODE
        codes.put("r729j", player -> {

            ItemStack boots = new ItemStack(Material.LEATHER_BOOTS);
            player.getInventory().addItem(boots);

            player.sendMessage("§cyeah man, you really fell for that? did u really think this tunnel led somewhere- imagine being so bad...");
        });

        // 🪖 HELMET
        codes.put("q2w9p", player -> {
            ItemStack helmet = new ItemStack(Material.NETHERITE_HELMET);
            helmet.addEnchantment(Enchantment.PROTECTION, 4);
            helmet.addEnchantment(Enchantment.UNBREAKING, 2);
            player.getInventory().addItem(helmet);
        });

        // 🦺 CHESTPLATE
        codes.put("m8v3k", player -> {
            ItemStack chest = new ItemStack(Material.NETHERITE_CHESTPLATE);
            chest.addEnchantment(Enchantment.PROTECTION, 4);
            chest.addEnchantment(Enchantment.UNBREAKING, 3);
            player.getInventory().addItem(chest);
        });

        // 👖 LEGGINGS
        codes.put("z1n6t", player -> {
            ItemStack legs = new ItemStack(Material.NETHERITE_LEGGINGS);
            legs.addEnchantment(Enchantment.PROTECTION, 2);
            player.getInventory().addItem(legs);
        });

        // 🔱 MAXED NETHERITE SPEAR (replaces trident)
        codes.put("p4r7s", player -> {

            ItemStack spear = new ItemStack(Material.NETHERITE_SWORD);
            ItemMeta meta = spear.getItemMeta();

            meta.setDisplayName("§6Netherite Spear");
            meta.setLore(List.of(
                    "§7A weapon forged beyond the depths",
                    "§cMaxed Out"
            ));

            spear.setItemMeta(meta);

            spear.addEnchantment(Enchantment.SHARPNESS, 5);
            spear.addEnchantment(Enchantment.UNBREAKING, 3);
            spear.addEnchantment(Enchantment.MENDING, 1);
            spear.addEnchantment(Enchantment.FIRE_ASPECT, 2);
            spear.addEnchantment(Enchantment.KNOCKBACK, 2);

            player.getInventory().addItem(spear);
        });

        // 👢 BOOTS SET
        codes.put("this is not a code", player -> {
            ItemStack boots = new ItemStack(Material.NETHERITE_BOOTS);
            boots.addEnchantment(Enchantment.PROTECTION, 4);
            boots.addEnchantment(Enchantment.UNBREAKING, 3);
            player.getInventory().addItem(boots);
        });

        // 🔥 pkz79
        codes.put("pkz79", player -> {

            ItemStack mace = new ItemStack(Material.NETHERITE_AXE);
            mace.addEnchantment(Enchantment.SHARPNESS, 5);
            mace.addEnchantment(Enchantment.UNBREAKING, 3);

            ItemStack windCharges = new ItemStack(Material.SNOWBALL, 5);

            player.getInventory().addItem(mace, windCharges);
        });

        // 🏹 arrows
        codes.put("arrows", player -> {

            ItemStack bow = new ItemStack(Material.BOW);
            bow.addEnchantment(Enchantment.POWER, 5);
            bow.addEnchantment(Enchantment.INFINITY, 1);
            bow.addEnchantment(Enchantment.UNBREAKING, 3);
            bow.addEnchantment(Enchantment.FLAME, 1);

            ItemStack spectral = new ItemStack(Material.SPECTRAL_ARROW, 64);

            player.getInventory().addItem(bow, spectral);
        });
    }

    // 🎮 MAIN HANDLER
    public static boolean useCode(String code, Player player) {

        code = code.trim().toLowerCase();

        // 💡 SPLIT CODE
        if (code.equals(FULL_SPLIT)) {
            player.getInventory().addItem(new ItemStack(Material.LEVER));
            player.sendMessage("§aYou discovered a hidden reward!");
            return true;
        }

        // 💡 HINT CODES
        if (code.equals(PART_A) || code.equals(PART_B)) {
            player.sendMessage("§eMaybe you're missing something?");
            return false;
        }

        // 💀 SPECIAL TROLL CODE
        if (code.equals("r729j")) {
            ItemStack rottingFlesh = new ItemStack(Material.ROTTEN_FLESH); // Changed this line
            player.getInventory().addItem(rottingFlesh);

            player.sendMessage("§cyeah man, you really fell for that? did u really think this tunnel led somewhere- imagine being so bad...");
            return true;
        }


        // 🎁 NORMAL CODES
        Reward reward = codes.get(code);
        if (reward == null) return false;

        reward.give(player);
        return true;
    }

    @FunctionalInterface
    interface Reward {
        void give(Player player);
    }
}