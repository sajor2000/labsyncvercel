import { storage } from "./storage";

/**
 * Automation Scheduler - Background service for processing automated workflows
 * This service runs continuously and manages:
 * - Recurring task generation
 * - Scheduled workflow execution
 * - Trigger condition monitoring
 */
export class AutomationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private intervalMs: number = 60000) {} // Default: 1 minute

  /**
   * Start the automation scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log("Automation scheduler is already running");
      return;
    }

    console.log("🤖 Starting Automation Scheduler...");
    this.isRunning = true;

    // Run immediately on start
    this.processScheduledTasks().catch(console.error);

    // Set up recurring processing
    this.intervalId = setInterval(async () => {
      try {
        await this.processScheduledTasks();
      } catch (error) {
        console.error("Error in automation scheduler:", error);
      }
    }, this.intervalMs);

    console.log(`✅ Automation Scheduler started (interval: ${this.intervalMs}ms)`);
  }

  /**
   * Stop the automation scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("⏹️ Automation Scheduler stopped");
  }

  /**
   * Process all scheduled automation tasks
   */
  private async processScheduledTasks(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Process recurring tasks
      await this.processRecurringTasks();
      
      // Process scheduled workflows
      await this.processScheduledWorkflows();
      
      // Process due schedules
      await this.processDueSchedules();

      const duration = Date.now() - startTime;
      console.log(`🔄 Automation cycle completed in ${duration}ms`);
    } catch (error) {
      console.error("Error processing scheduled tasks:", error);
    }
  }

  /**
   * Process recurring tasks that are due
   */
  private async processRecurringTasks(): Promise<void> {
    try {
      await storage.processRecurringTasks();
    } catch (error) {
      console.error("Error processing recurring tasks:", error);
    }
  }

  /**
   * Process scheduled workflows
   */
  private async processScheduledWorkflows(): Promise<void> {
    try {
      const dueSchedules = await storage.getSchedulesDue();
      
      for (const schedule of dueSchedules) {
        if (schedule.triggerId) {
          // Find automation rules for this trigger
          const rules = await storage.getAutomationRules(schedule.labId, schedule.triggerId);
          
          for (const rule of rules) {
            try {
              console.log(`🎯 Executing scheduled automation rule: ${rule.name}`);
              await storage.executeAutomationRule(rule.id, "SCHEDULER");
              
              // Update schedule for next run
              await this.updateScheduleNextRun(schedule);
            } catch (error) {
              console.error(`Failed to execute rule ${rule.id}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing scheduled workflows:", error);
    }
  }

  /**
   * Process due schedules and update next run times
   */
  private async processDueSchedules(): Promise<void> {
    try {
      const dueSchedules = await storage.getSchedulesDue();
      
      for (const schedule of dueSchedules) {
        await this.updateScheduleNextRun(schedule);
      }
    } catch (error) {
      console.error("Error processing due schedules:", error);
    }
  }

  /**
   * Update schedule for next run based on its pattern
   */
  private async updateScheduleNextRun(schedule: any): Promise<void> {
    try {
      let nextRunTime: Date;
      const now = new Date();

      switch (schedule.scheduleType) {
        case "CRON":
          // For cron expressions, we'd need a cron parser
          // For now, default to next day
          nextRunTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
          
        case "RECURRING":
          const pattern = schedule.recurringPattern as any;
          nextRunTime = this.calculateNextRecurringDate(now, pattern);
          break;
          
        case "SMART":
          // Intelligent scheduling based on usage patterns
          nextRunTime = await this.calculateSmartSchedule(schedule);
          break;
          
        default:
          nextRunTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }

      // Update schedule
      await storage.updateAutomatedSchedule(schedule.id, {
        nextRunTime,
        lastRunTime: now,
        runCount: (parseInt(schedule.runCount || "0") + 1).toString(),
      });

    } catch (error) {
      console.error(`Error updating schedule ${schedule.id}:`, error);
    }
  }

  /**
   * Calculate next run time for recurring patterns
   */
  private calculateNextRecurringDate(from: Date, pattern: any): Date {
    const interval = pattern.interval || 1;
    const next = new Date(from);

    switch (pattern.type) {
      case "DAILY":
        next.setDate(next.getDate() + interval);
        break;
      case "WEEKLY":
        next.setDate(next.getDate() + interval * 7);
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + interval);
        break;
      case "QUARTERLY":
        next.setMonth(next.getMonth() + interval * 3);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Calculate smart schedule based on usage patterns
   */
  private async calculateSmartSchedule(schedule: any): Promise<Date> {
    // For now, implement basic smart scheduling
    // In a real system, this would analyze usage patterns, team activity, etc.
    const config = schedule.smartConfig as any;
    const now = new Date();
    
    // Default to business hours (9 AM - 5 PM)
    const next = new Date(now);
    next.setHours(config.preferredHour || 9, 0, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
    };
  }
}

// Export singleton instance
export const automationScheduler = new AutomationScheduler();