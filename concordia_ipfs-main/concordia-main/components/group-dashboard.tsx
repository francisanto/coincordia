"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContributionModal } from './contribution-modal';
import { InviteMemberModal } from './invite-member-modal';
import { GroupDetailsModal } from './group-details-modal';
import { GroupOptions } from './group-options';
import { persistentStorageService } from '@/lib/persistent-storage';
import { GroupMetadata } from '@/lib/types';

export interface SavingsGroup extends GroupMetadata {
  id: string;
  name: string;
  goal?: string;
  targetAmount: number;
  currentAmount: number;
  contributionAmount: number;
  duration: string;
  endDate: string;
  members: {
    address: string;
    nickname: string;
    contributed: number;
    status: string;
  }[];
  nextContribution: string;
  inviteCode?: string;
  status: string;
  isActive: boolean;
  ipfsHash?: string;
  ipfsGatewayUrl?: string;
  arweaveTransactionId?: string;
  arweaveStatus?: 'pending' | 'confirmed' | 'failed';
  arweaveTimestamp?: string;
}

interface GroupDashboardProps {
  groups: GroupMetadata[];
  onGroupsChange: () => void;
  userAddress?: string;
}

export function GroupDashboard({ groups, onGroupsChange, userAddress }: GroupDashboardProps) {
  const [selectedGroup, setSelectedGroup] = useState<GroupMetadata | null>(null);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleContribution = async (amount: number) => {
    if (!selectedGroup || !userAddress) return;

    try {
      console.log('💰 Processing contribution:', amount);

      // Update group with new contribution
      const updatedGroup = {
        ...selectedGroup,
        contributions: [
          ...selectedGroup.contributions,
          {
            id: `contrib_${Date.now()}`,
            contributor: userAddress,
            memberAddress: userAddress,
            amount,
            timestamp: new Date().toISOString(),
            auraPoints: Math.floor(amount * 0.1),
            isEarly: selectedGroup.contributions.length === 0,
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            status: 'confirmed' as const,
          },
        ],
      };

      // Update member contribution
      const memberIndex = updatedGroup.members.findIndex(
        m => m.address.toLowerCase() === userAddress.toLowerCase()
      );

      if (memberIndex !== -1) {
        updatedGroup.members[memberIndex].contribution += amount;
        updatedGroup.members[memberIndex].auraPoints += Math.floor(amount * 0.1);
      }

      const result = await persistentStorageService.saveGroup(selectedGroup.groupId, updatedGroup);
      if (result.success) {
        onGroupsChange();
        setShowContributionModal(false);
        console.log('✅ Contribution added successfully');
      } else {
        console.error('❌ Failed to add contribution:', result.error);
      }
    } catch (error) {
      console.error('❌ Error adding contribution:', error);
    }
  };

  const handleInviteMember = async (inviteCode: string) => {
    if (!selectedGroup) return;

    try {
      console.log('💌 Creating invite:', inviteCode);

      await persistentStorageService.saveInvite(inviteCode, selectedGroup.groupId);
      setShowInviteModal(false);

      console.log('✅ Invite created successfully');
    } catch (error) {
      console.error('❌ Error creating invite:', error);
    }
  };

  if (groups.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">No Groups Yet</h3>
            <p className="text-sm">Create your first savings group to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.groupId} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
              </div>
              <GroupOptions
                group={group}
                userAddress={userAddress}
                onDelete={() => onGroupsChange()}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    ${group.contributions.reduce((sum, c) => sum + c.amount, 0)} / ${group.goalAmount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (group.contributions.reduce((sum, c) => sum + c.amount, 0) / group.goalAmount) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Members */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Members</span>
                <Badge variant="outline">{group.members.length}</Badge>
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Due Date</span>
                <Badge variant="outline">
                  {new Date(group.withdrawalDate).toLocaleDateString()}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowContributionModal(true);
                  }}
                  className="flex-1"
                >
                  Contribute
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowDetailsModal(true);
                  }}
                  className="flex-1"
                >
                  Details
                </Button>
                {group.creator.toLowerCase() === userAddress?.toLowerCase() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowInviteModal(true);
                    }}
                  >
                    Invite
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Modals */}
      {showContributionModal && selectedGroup && (
        <ContributionModal
          group={selectedGroup}
          onContribute={handleContribution}
          onClose={() => setShowContributionModal(false)}
        />
      )}

      {showInviteModal && selectedGroup && (
        <InviteMemberModal
          group={selectedGroup}
          onInvite={handleInviteMember}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showDetailsModal && selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}