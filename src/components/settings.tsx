"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import type { Settings } from "@/types/types";
import { CALCULATION_METHODS } from "@/constants/calculation-methods";

const adhanOptions = [
  { value: 'default', label: 'Default Adhan' },
  { value: 'makkah', label: 'Makkah Adhan (Al-Haram)' },
  { value: 'madinah', label: 'Madinah Adhan (Al-Masjid an-Nabawi)' },
  { value: 'alaqsa', label: 'Al-Aqsa Adhan' },
] as const;

type AdhanType = typeof adhanOptions[number]['value'];

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  calculationMethod: 2,
  school: 0,
  notifications: true,
  adhan: false,
  notificationTimes: {
    beforePrayer: 15,
    fajrNotification: true,
    dhuhrNotification: true,
    asrNotification: true,
    maghribNotification: true,
    ishaNotification: true,
  },
  adhanSettings: {
    playAthan: false,
    volume: 50,
    muezzin: 'default' as AdhanType,
  },
};

export function SettingsComponent() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load settings from localStorage with proper default values
    const savedSettings = localStorage.getItem("prayerSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Ensure adhanSettings exists with default values
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          adhanSettings: {
            ...DEFAULT_SETTINGS.adhanSettings,
            ...(parsed.adhanSettings || {})
          }
        };
        setSettings(mergedSettings);
      } catch (error) {
        console.error('Error parsing settings:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    }
    setIsLoading(false);
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...newSettings,
        // Ensure adhanSettings is properly merged if it's being updated
        adhanSettings: newSettings.adhanSettings ? {
          ...prev.adhanSettings,
          ...newSettings.adhanSettings
        } : prev.adhanSettings
      };
      localStorage.setItem("prayerSettings", JSON.stringify(updated));
      return updated;
    });
    toast.success("Settings updated successfully");
  };

  const handleNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications are not supported in this browser");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        updateSettings({ notifications: true });
        toast.success("Notifications enabled");
      } else {
        updateSettings({ notifications: false });
        toast.error("Notification permission denied");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to enable notifications");
    }
  };

  // Update the Adhan toggle to initialize adhanSettings
  const handleAdhanToggle = (checked: boolean) => {
    updateSettings({
      adhan: checked,
      // Initialize adhanSettings if enabling adhan
      ...(checked && {
        adhanSettings: {
          ...DEFAULT_SETTINGS.adhanSettings,
          playAthan: true
        }
      })
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" passHref>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={theme}
                onValueChange={(value: "light" | "dark" | "system") => {
                  setTheme(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calculation Method */}
            <div className="space-y-2">
              <Label>Prayer Calculation Method</Label>
              <Select
                value={settings.calculationMethod.toString()}
                onValueChange={(value) => {
                  updateSettings({ calculationMethod: parseInt(value) });
                  // Refresh prayer times when method changes
                  window.location.reload();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select calculation method" />
                </SelectTrigger>
                <SelectContent>
                  {CALCULATION_METHODS.map((method) => (
                    <SelectItem
                      key={method.id}
                      value={method.id.toString()}
                      className="flex flex-col items-start"
                    >
                      <span className="font-medium">{method.name}</span>
                      {method.description && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {method.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Different regions use different calculation methods. Choose the
                one that matches your location or preference.
              </p>
            </div>

            {/* School Selection */}
            <div className="space-y-2">
              <Label>Juristic School</Label>
              <Select
                value={settings.school.toString()}
                onValueChange={(value) =>
                  updateSettings({ school: parseInt(value) as 0 | 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Shafi</SelectItem>
                  <SelectItem value="1">Hanafi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive prayer time notifications
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={() => handleNotificationPermission()}
              />
            </div>

            {/* Adhan */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Adhan</Label>
                <p className="text-sm text-muted-foreground">
                  Play adhan at prayer times
                </p>
              </div>
              <Switch
                checked={settings.adhan}
                onCheckedChange={handleAdhanToggle}
              />
            </div>

            {/* Adhan Selection */}
            {settings.adhan && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Adhan Selection</Label>
                  <Select
                    value={settings.adhanSettings.muezzin}
                    onValueChange={(value: AdhanType) =>
                      updateSettings({
                        adhanSettings: {
                          ...settings.adhanSettings,
                          muezzin: value
                        }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Adhan" />
                    </SelectTrigger>
                    <SelectContent>
                      {adhanOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Volume Control */}
                <div className="space-y-2">
                  <Label>Adhan Volume</Label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.adhanSettings.volume}
                    onChange={(e) =>
                      updateSettings({
                        adhanSettings: {
                          ...settings.adhanSettings,
                          volume: parseInt(e.target.value)
                        }
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>{settings.adhanSettings.volume}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
