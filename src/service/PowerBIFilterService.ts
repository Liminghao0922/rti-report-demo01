/*
SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
SPDX-License-Identifier: MIT
*/

import { Report } from 'powerbi-client';
import { models } from 'powerbi-client';

export class PowerBIFilterService {
  private report: Report | null = null;

  setReportInstance(report: Report) {
    this.report = report;
  }

  /**
   * Apply region filter - simple single-value filter
   */
  async applyRegionFilter(region: string): Promise<void> {
    if (!this.report) {
      console.error('❌ Report instance not initialized');
      return;
    }

    try {
      const filter: models.IBasicFilter = {
        $schema: process.env.POWERBI_BASIC_FILTER_SCHEMA,
        target: {
          table: process.env.POWERBI_TABLE_NAME,
          column: process.env.POWERBI_TABLE_COLUMN_NAME,
        },
        operator: 'In',
        values: [region],
        filterType: models.FilterType.Basic,
      };

      await this.report.setFilters([filter]);
      console.log(`✅ Filter applied: ${process.env.POWERBI_TABLE_COLUMN_NAME} = ${region}`);
    } catch (error) {
      console.error('❌ Failed to apply filter:', error);
    }
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    if (!this.report) {
      console.error('❌ Report instance not initialized');
      return;
    }

    try {
      await this.report.setFilters([]);
      console.log('✅ All filters cleared');
    } catch (error) {
      console.error('❌ Failed to clear filters:', error);
    }
  }

  /**
   * Apply time filter using Advanced Filter to support time range
   * @param currentTime - ISO 8601 time string
   * @param timeColumnName - Power BI time column name (optional, falls back to env)
   */
  async applyTimeFilter(currentTime: string, timeColumnName?: string): Promise<void> {
    if (!this.report) {
      console.error('❌ Report instance not initialized');
      return;
    }

    try {
      const columnName = timeColumnName || process.env.POWERBI_TIME_COLUMN_NAME || 'DateTime';
      const tableName = process.env.POWERBI_TABLE_NAME || 'Table1';

      // Use Advanced Filter to build a time-bound filter
      // Assumes we want to show data up to the specified point in time
      const filter: models.IAdvancedFilter = {
        $schema: 'http://powerbi.com/product/schema#advanced',
        target: {
          table: tableName,
          column: columnName,
        },
        logicalOperator: 'And',
        conditions: [
          {
            operator: 'LessThanOrEqual',
            value: currentTime,
          },
        ],
        filterType: models.FilterType.Advanced,
      };

      await this.report.setFilters([filter]);
      console.log(`✅ Time filter applied: ${columnName} <= ${currentTime}`);
    } catch (error) {
      console.error('❌ Failed to apply time filter:', error);
    }
  }

  /**
   * Apply time range filter
   * @param startTime - start time (ISO 8601)
   * @param endTime - end time (ISO 8601)
   * @param timeColumnName - Power BI time column name (optional)
   */
  async applyTimeRangeFilter(startTime: string, endTime: string, timeColumnName?: string): Promise<void> {
    if (!this.report) {
      console.error('❌ Report instance not initialized');
      return;
    }

    try {
      const columnName = timeColumnName || process.env.POWERBI_TIME_COLUMN_NAME || 'DateTime';
      const tableName = process.env.POWERBI_TABLE_NAME || 'Table1';

      const filter: models.IAdvancedFilter = {
        $schema: 'http://powerbi.com/product/schema#advanced',
        target: {
          table: tableName,
          column: columnName,
        },
        logicalOperator: 'And',
        conditions: [
          {
            operator: 'GreaterThanOrEqual',
            value: startTime,
          },
          {
            operator: 'LessThanOrEqual',
            value: endTime,
          },
        ],
        filterType: models.FilterType.Advanced,
      };

      await this.report.setFilters([filter]);
      console.log(`✅ Time range filter applied: ${startTime} to ${endTime}`);
    } catch (error) {
      console.error('❌ Failed to apply time range filter:', error);
    }
  }
}

export const powerBIFilterService = new PowerBIFilterService();
