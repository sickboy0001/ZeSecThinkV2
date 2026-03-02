"use client";

import { useState, useEffect } from "react";
import { BasicInfoSection } from "@/components/molecules/UserSettingProfile/BasicInfoSection";
import { BillingSection } from "@/components/molecules/UserSettingProfile/BillingSection";
import { AISettingsSection } from "@/components/molecules/UserSettingProfile/AISettingsSection";
import { SummarySettingsSection } from "@/components/molecules/UserSettingProfile/SummarySettingsSection";
import {
  getUserProfile,
  updateUserProfile,
  UserProfile,
} from "@/services/user_profile_service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  userId: string;
}

export default function ProfileSettings({ userId }: Props) {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getUserProfile(userId);
        setData(profile);
      } catch (error) {
        console.error(error);
        toast.error("プロフィールの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await updateUserProfile(userId, data);
      toast.success("設定を保存しました");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("保存に失敗しました");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10">データを読み込めませんでした</div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">プロフィール設定</h1>

      <div className="grid gap-6">
        {/* 基本情報セクション */}
        <BasicInfoSection
          value={{
            fullName: data.fullName,
            notifyEmail: data.notifyEmail,
            isAdmin: data.isAdmin,
          }}
          onChange={(val) => setData({ ...data, ...val })}
        />

        {/* 課金設定セクション */}
        <BillingSection
          value={data.plan}
          onChange={(val) => setData({ ...data, plan: val })}
        />

        {/* AI機能設定セクション */}
        <AISettingsSection
          value={{
            typoCorrection: data.typoCorrection,
            summaryGeneration: data.summaryGeneration,
          }}
          onChange={(val) => setData({ ...data, ...val })}
        />

        {/* サマリ設定セクション */}
        <SummarySettingsSection
          value={{
            weeklyPattern: data.weeklyPattern,
            weeklyTime: data.weeklyTime,
            monthlyDay: data.monthlyDay,
            monthlyTime: data.monthlyTime,
            monthlyEnabled: data.monthlyEnabled,
          }}
          onChange={(val) => setData({ ...data, ...val })}
        />

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
}
