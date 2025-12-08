-- SQL Script to create security_incidents table
-- Run this script in your SQL Server database to create the table for security incident management

USE [_rifiiorg_db];
GO

-- Create table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[security_incidents]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[security_incidents] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [incident_title] VARCHAR(100) NOT NULL,
        [category] VARCHAR(50) NOT NULL,
        [location_district] VARCHAR(150) NOT NULL,
        [location_province] VARCHAR(150) NOT NULL,
        [incident_date] DATE NOT NULL,
        [incident_summary] NVARCHAR(MAX) NOT NULL,
        [operational_impact] NVARCHAR(MAX) NOT NULL,
        [recommended_actions] NVARCHAR(MAX) NOT NULL,
        [date_reported] DATETIME DEFAULT GETDATE(),
        [reported_by] VARCHAR(100) NULL
    );
    
    PRINT 'Table security_incidents created successfully.';
END
ELSE
BEGIN
    PRINT 'Table security_incidents already exists.';
END
GO

