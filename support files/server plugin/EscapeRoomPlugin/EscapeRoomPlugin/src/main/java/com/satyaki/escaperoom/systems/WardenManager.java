package com.satyaki.escaperoom.systems;

public class WardenManager {

    private static long lastDeathTime = 0;

    // Record when Warden dies
    public static void recordDeath() {
        lastDeathTime = System.currentTimeMillis();
    }

    // Check if we can spawn a new Warden
    public static boolean canSpawn() {
        long now = System.currentTimeMillis();
        return (now - lastDeathTime) >= 30000; // 30 seconds
    }

    // Get remaining cooldown (ms)
    public static long getRemainingCooldown() {
        long now = System.currentTimeMillis();
        long remaining = 30000 - (now - lastDeathTime);
        return Math.max(0, remaining);
    }
}