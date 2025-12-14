import { Injectable } from '@angular/core';

export type Role =
  | 'admin'
  | 'management_L1'
  | 'regulatory_L1'
  | 'revenue_L1'
  | 'nationalGrid_L1'
  | 'secDistribution_L1'
  | 'management_L2'
  | 'regulatory_L2'
  | 'revenue_L2'
  | 'nationalGrid_L2'
  | 'secDistribution_L2'
  | 'management_L3'
  | 'regulatory_L3'
  | 'revenue_L3'
  | 'nationalGrid_L3'
  | 'secDistribution_L3';

export interface Permissions {
  canEdit: boolean;
  canReportIssue: boolean;
  canApprove: boolean;
  canAddComment: boolean;
  canCompleteReview:boolean;
}

// Role-specific permissions
const rolePermissions: Record<Role, Permissions> = {
  admin: {
    canEdit: false,
    canReportIssue: false,
    canApprove: false,
    canAddComment: false,
    canCompleteReview:false

  },
  nationalGrid_L1: {
    canEdit: true,
    canReportIssue: false,
    canApprove: false,
    canAddComment: true,
    canCompleteReview:true

  },
  
  secDistribution_L1: {
    canEdit: true,
    canReportIssue: false,
    canApprove: false,
    canAddComment: true,
    canCompleteReview:true
  },
  management_L1: {
    canEdit: false,
    canReportIssue: true,
    canApprove: false,
    canAddComment: true,
    canCompleteReview:true
  },
  regulatory_L1: {
    canEdit: false,
    canReportIssue: true,
    canApprove: false,
    canAddComment: true,
    canCompleteReview:true
  },
  revenue_L1: {
    canEdit: false,
    canReportIssue: true,
    canApprove: false,
    canAddComment: true,
    canCompleteReview:true
  },
  nationalGrid_L2: {
    canEdit: true,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
  
  secDistribution_L2: {
    canEdit: true,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
  management_L2: {
    canEdit: false,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
  regulatory_L2: {
    canEdit: false,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
  revenue_L2: {
    canEdit: false,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
   nationalGrid_L3: {
    canEdit: true,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
  
  secDistribution_L3: {
    canEdit: true,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
  management_L3: {
    canEdit: false,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
  regulatory_L3: {
    canEdit: false,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
  revenue_L3: {
    canEdit: false,
    canReportIssue: true,
    canApprove: true,
    canAddComment: true,
    canCompleteReview:false
  },
};

// Role-to-Stages mapping (now supports multiple stages per role)
const roleStages: Record<Role, string[]> = {
  admin: ['SEC Distribution', 'National Grid'], // Admin can act in either stage
  nationalGrid_L1: ['National Grid'], // Admin can act in either stage
  secDistribution_L1: ['SEC Distribution'], // Admin can act in either stage
  management_L1: ['Management Accounting Department'],
  regulatory_L1: ['Regulatory Affairs'],
  revenue_L1: ['Revenue Assurance & Accounts Receivable'],
  nationalGrid_L2: ['National Grid'], // Admin can act in either stage
  secDistribution_L2: ['SEC Distribution'], // Admin can act in either stage
  management_L2: ['Management Accounting Department'],
  regulatory_L2: ['Regulatory Affairs'],
  revenue_L2: ['Revenue Assurance & Accounts Receivable'],
  nationalGrid_L3: ['National Grid'], // Admin can act in either stage
  secDistribution_L3: ['SEC Distribution'], // Admin can act in either stage
  management_L3: ['Management Accounting Department'],
  regulatory_L3: ['Regulatory Affairs'],
  revenue_L3: ['Revenue Assurance & Accounts Receivable'],
};

@Injectable({
  providedIn: 'root',
})
export class AccessControlService {
  private adminOverrideEnabled = false; // Toggle for overriding admin access

  constructor() {}

  // Enable or disable the admin override
  setAdminOverride(enabled: boolean): void {
    this.adminOverrideEnabled = enabled;
  }

  // Get user stages based on the role
  getUserStages(role: Role): string[] {
    if (role === 'admin' && this.adminOverrideEnabled) {
      return Object.values(roleStages).flat(); // Allow access to all stages
    }

    if (!roleStages[role]) {
      console.warn(`Role ${role} is not defined. Defaulting to no stages.`);
      return []; // Default to no stages
    }
    return roleStages[role];
  }

  // Check permissions for a given role, stage, and action
  canPerformAction(
    role: Role,
    currentStage: string,
    action: keyof Permissions
  ): boolean {

    if(currentStage === undefined || currentStage === "" || currentStage === "Default"){
      return false;
    }
	//role= 'admin'
    if (role === 'admin' && this.adminOverrideEnabled) {
      return true; // Allow all actions for admin when override is enabled
    }

    const permissions = rolePermissions[role];
    if (!permissions) {
      console.warn(`Role ${role} is not defined. No permissions granted.`);
      return false; // Default to no permissions
    }

    // Turn-based logic: User can only act when the currentStage matches any of their stages
      const userStages = this.getUserStages(role);
    //console.log(userStages)
    if (!userStages.includes(currentStage)) {
      console.warn(
        `Role ${role} cannot act because the current stage (${currentStage}) is not in their allowed stages (${userStages.join(
          ', '
        )}).`
      );
      return false; // Users can't perform actions outside their stages
    }

    // Check if the action is allowed for the role
    return permissions[action];
  }
}
