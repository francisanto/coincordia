"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { persistentStorageService } from '@/lib/persistent-storage';

export function StorageStatus() {
  const [storageInfo, setStorageInfo] = useState({
    isLocalStorageAvailable: false,
    totalGroups: 0,
    lastUpdated: null as string | null,
  });

  useEffect(() => {
    const checkStorage = () => {
      try {
        // Check localStorage
        const isLocalStorageAvailable = typeof Storage !== 'undefined';

        // Get groups count
        let totalGroups = 0;
        let lastUpdated = null;

        if (isLocalStorageAvailable) {
          const stored = localStorage.getItem('concordia-groups');
          if (stored) {
            const groups = JSON.parse(stored);
            totalGroups = Object.keys(groups).length;

            // Find the most recent update
            const groupList = Object.values(groups) as any[];
            if (groupList.length > 0) {
              const sortedGroups = groupList.sort((a, b) =>
                new Date(b.updatedAt || b.createdAt).getTime() -
                new Date(a.updatedAt || a.createdAt).getTime()
              );
              lastUpdated = sortedGroups[0].updatedAt || sortedGroups[0].createdAt;
            }
          }
        }

        setStorageInfo({
          isLocalStorageAvailable,
          totalGroups,
          lastUpdated,
        });
      } catch (error) {
        console.error('Error checking storage:', error);
      }
    };

    checkStorage();

    // Check storage every 30 seconds
    const interval = setInterval(checkStorage, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💾 Storage Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Local Storage Status */}
        <div className="flex items-center justify-between">
          <span>Local Storage</span>
          <Badge variant={storageInfo.isLocalStorageAvailable ? "default" : "destructive"}>
            {storageInfo.isLocalStorageAvailable ? "✅ Available" : "❌ Unavailable"}
          </Badge>
        </div>

        {/* Groups Count */}
        <div className="flex items-center justify-between">
          <span>Total Groups</span>
          <Badge variant="outline">
            {storageInfo.totalGroups}
          </Badge>
        </div>

        {/* Last Updated */}
        {storageInfo.lastUpdated && (
          <div className="flex items-center justify-between">
            <span>Last Updated</span>
            <Badge variant="outline">
              {new Date(storageInfo.lastUpdated).toLocaleDateString()}
            </Badge>
          </div>
        )}

        {/* Storage Type */}
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <div className="font-medium mb-1">Storage Method:</div>
          <div>Browser Local Storage</div>
          <div className="text-xs mt-1 opacity-70">
            Data is stored locally in your browser
          </div>
        </div>
      </CardContent>
    </Card>
  );
}