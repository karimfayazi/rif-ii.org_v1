-- SQL Script to create tblKMLFiles table
-- Run this script in your SQL Server database to create the table for KML file management

USE [_rifiiorg_db];
GO

-- Create table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tblKMLFiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[tblKMLFiles] (
        [ID] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [FilePath] NVARCHAR(500) NOT NULL,
        [UploadDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UploadedBy] NVARCHAR(100) NULL
    );
    
    PRINT 'Table tblKMLFiles created successfully.';
END
ELSE
BEGIN
    PRINT 'Table tblKMLFiles already exists.';
END
GO

