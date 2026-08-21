# Asset Guardian

Create an Office Asset Management Dashboard

Build a professional and easy-to-use Office Asset Management Dashboard for managing every physical item present in our office.

The system should work as a complete asset registry where we can record, locate, assign, track, update, import, export, and manage every item in the organization — from laptops and computers to chairs, tables, bathroom items, electrical equipment, stationery, and other small objects.

Keep the application clean, professional, responsive, and simple to use. Do not make the interface unnecessarily complicated.

1. Main Dashboard

Create a dashboard showing a clear overview of all assets.

Show cards for:

Total Assets

Assets Available

Assets Assigned

Assets Under Maintenance

Damaged Assets

Lost Assets

Retired/Disposed Assets

Total Asset Value

Also show:

Assets by Category

Assets by Floor

Assets by Room

Assets by Status

Assets assigned to employees

Recently Added Assets

Recently Assigned Assets

Assets requiring attention

Add charts where useful, but keep them simple and readable.

2. Asset Management

Create an Assets section containing a complete list of all assets.

Each asset should have a unique Asset ID.

When creating an asset, allow the following information:

Basic Information

Asset Name

Asset ID

Asset Category

Asset Type

Description

Company Ownership

Brand

Model

Serial Number

Quantity

Condition

Status

Purchase Information

Purchase Date

Purchase Price

Vendor/Supplier

Invoice Number

Warranty Start Date

Warranty End Date

Location Information

Allow assets to be assigned to:

Building

Floor

Room

Area

Desk/Specific Location

Example:

Main Office → 2nd Floor → Director's Office → Director Desk

Assignment Information

An asset should be assignable to an employee/person.

Store:

Assigned To

Employee ID

Department

Designation

Assignment Date

Expected Return Date

Assignment Notes

The asset should be able to be reassigned to another person later.

Maintain the complete assignment history.

3. Asset Categories

Create flexible categories so administrators can add new categories later.

Include default categories such as:

Laptops

Desktop Computers

CPUs

Monitors

Keyboards

Mice

Printers

Scanners

Projectors

UPS

Routers

Network Equipment

Phones

Tablets

IT Accessories

Chairs

Tables

Desks

Cabinets

Sofas

Electrical Equipment

Air Conditioners

Fans

Lights

Extension Boards

Pantry Items

Bathroom Items

Cleaning Equipment

Safety Equipment

Fire Extinguishers

Stationery

Miscellaneous

The administrator should be able to create, edit, and delete custom categories.

4. Locations

Create a dedicated Locations section.

We should be able to create:

Buildings

Floors

Rooms

Areas

For example:

Building: Main Office

Floor: Ground Floor

Rooms:

Reception

HR Room

Meeting Room

Staff Room

Accounts Room

Director Office

IT Room

Pantry

Bathroom

The system should show how many assets are present in each location.

When opening a room, show all assets currently located there.

Example:

Director's Office

1 Laptop

1 Monitor

1 Desk

1 Chair

1 AC

1 Printer

2 Lights

5. Employees / Users

Create an Employees section.

Store:

Employee Name

Employee ID

Department

Designation

Contact Information

Office Location

Active/Inactive Status

When viewing an employee, show all assets currently assigned to that person.

Example:

Employee: Rahul Sharma

Assigned Assets:

Laptop — AST-00021

Monitor — AST-00022

Keyboard — AST-00023

Mouse — AST-00024

Mobile Phone — AST-00025

Provide an easy option to assign or return assets.

6. QR Code Generation

This is one of the most important features.

Every newly created asset should automatically receive a unique Asset ID and QR code.

Example:

Asset ID:

AST-000001

The QR code should be linked to that specific asset record.

When someone scans the QR code, open the asset's details page.

The QR page should display:

Asset Name

Asset ID

Category

Brand

Model

Serial Number

Current Status

Current Location

Assigned Person

Condition

Company Ownership

Basic asset information

Do not allow one asset's QR code to open another asset.

Each asset must have its own unique QR code.

Provide options to:

View QR

Download QR

Print QR

Print Asset Label

Create a professional printable asset label containing:

Company name/logo

Asset name

Asset ID

QR code

7. QR Scanning

Create a Scan Asset QR option in the dashboard.

The user should be able to scan an asset QR code using the device camera.

After scanning, immediately open the corresponding asset record.

From the asset page, authorized users should be able to:

View asset

Edit asset

Assign asset

Change location

Change status

Report damage

Send for maintenance

Mark as lost

Return asset

8. Asset Assignment

Create a simple asset assignment workflow.

Example:

Select Asset → Select Employee → Select Assignment Date → Confirm Assignment

When assigned:

Asset Status = Assigned

The employee should automatically appear as the current holder of the asset.

When returned:

Asset Status = Available

Keep the previous assignment in the history.

Do not delete historical records.

9. Asset History

Every asset should have an Activity / History section.

Record important actions such as:

Asset Created

Asset Assigned

Asset Reassigned

Asset Returned

Location Changed

Status Changed

Maintenance Added

Damage Reported

Asset Marked Lost

Asset Recovered

Asset Retired

Show the date, time, user, and action.

10. Maintenance

Create a basic Maintenance section.

Allow users to record:

Asset

Maintenance Date

Problem

Description

Service Provider

Cost

Status

Expected Completion Date

Completion Date

Notes

When an asset is under maintenance, automatically change its status to:

Under Maintenance

Show maintenance history on the asset page.

11. Damage / Lost Asset Management

Allow users to report:

Damaged Asset

Lost Asset

Record:

Date

Reported By

Description

Location

Assigned Person

Notes

Current Resolution Status

Keep these records in the asset history.

12. Import Assets

Create an Import Assets option.

Allow administrators to import assets using Excel/CSV files.

Provide:

Upload CSV/Excel

Preview imported data

Validate data before importing

Show invalid rows/errors

Confirm Import

After successful import:

Create the assets

Generate unique Asset IDs

Generate QR codes for the imported assets

Provide a downloadable sample/template file showing the expected columns.

13. Export Assets

Create an Export option.

Allow users to export asset data to:

Excel

CSV

Allow exporting:

All assets

Assets by category

Assets by room

Assets by floor

Assets by employee

Assets by status

The exported file should contain useful asset information including Asset ID, asset name, category, location, assigned employee, status, condition, purchase details, etc.

14. Search and Filters

Provide global search.

Users should be able to search using:

Asset ID

Asset Name

Serial Number

Employee Name

Employee ID

Category

Room

Floor

Brand

Model

Add filters for:

Category

Status

Condition

Floor

Room

Assigned/Unassigned

Employee

Purchase date

15. Asset Details Page

Create a professional asset details page.

Show:

Asset Information

Asset Name
Asset ID
Category
Brand
Model
Serial Number
Status
Condition

Location

Building
Floor
Room
Specific Location

Assignment

Assigned Person
Employee ID
Department
Assignment Date

Purchase

Purchase Date
Purchase Price
Vendor
Invoice Number
Warranty

QR Code

Display the asset QR code with options to download and print it.

History

Show the complete activity timeline.

Maintenance

Show maintenance records.

Photos

Allow uploading photos of the asset.

16. Office Inventory View

Create an Office Inventory / Floor View.

Users should be able to select:

Building → Floor → Room

Then see the assets currently present in that location.

For example:

1st Floor

HR Room — 18 Assets

Accounts Room — 22 Assets

Director Office — 14 Assets

Staff Room — 35 Assets

Meeting Room — 20 Assets

This should make it very easy to physically verify office inventory.

17. Inventory Verification

Add an optional Inventory Verification feature.

A user can select a floor or room and start verification.

They can scan asset QR codes one by one.

The system should show:

Verified

Not Yet Verified

Unexpected Asset

At the end, show an inventory verification summary.

This will help us physically check whether the assets recorded in the system are actually present.

18. Asset Status

Use these default statuses:

Available

Assigned

In Use

Under Maintenance

Damaged

Lost

Retired

Disposed

Allow administrators to add additional statuses if required.

19. Asset Condition

Use:

New

Excellent

Good

Fair

Damaged

Non-functional

20. Users and Permissions

Create role-based access.

Suggested roles:

Super Admin

Full access to everything.

Admin

Can manage assets, locations, employees, assignments, imports, exports, and maintenance.

Staff/User

Can view assets, scan QR codes, and report issues according to permissions.

Restrict sensitive actions such as deleting assets to administrators.

Prefer soft-delete/archive instead of permanently deleting asset records.

21. Notifications / Alerts

Add a simple notification section for:

Warranty Expiring

Maintenance Due

Assets Under Maintenance

Damaged Assets

Lost Assets

Unassigned Assets

Assets requiring verification

22. Dashboard Quick Actions

Add prominent buttons:

Add Asset

Assign Asset

Scan QR

Import Assets

Export Assets

Add Employee

Add Location

Inventory Verification

23. Reports

Create a simple Reports section.

Useful reports:

Complete Asset Register

Assets by Category

Assets by Location

Assets by Employee

Assigned Assets

Unassigned Assets

Damaged Assets

Lost Assets

Maintenance Report

Asset Purchase Value Report

Inventory Verification Report

24. Important Asset Register Principle

The system must treat every physical object as an individual or quantity-based asset.

For important items such as:

Laptop

Computer

Monitor

Printer

Phone

UPS

Projector

Create an individual asset record and individual QR code.

For small low-value items where individual QR tagging is not practical, allow quantity-based inventory.

For example:

Stationery → Ball Pen → Quantity: 50

However, the system should still allow individual tracking whenever required.

25. User Interface

Create a modern professional admin dashboard.

Use:

Clean sidebar navigation

Dashboard cards

Tables

Search

Filters

Modal forms

Status badges

Charts

Responsive design

Mobile-friendly QR scanning

The design should feel like a professional enterprise asset management system rather than a basic CRUD application.

Keep navigation simple:

Dashboard
Assets
Employees
Locations
Assignments
Maintenance
Inventory Verification
Reports
Import / Export
Settings

26. Data Safety

Do not permanently delete important historical information.

Asset assignment history, maintenance history, and activity history should remain available even if an asset is retired or disposed.

Make sure Asset IDs and QR codes remain unique.

Prevent duplicate Asset IDs and duplicate serial numbers where applicable.

27. Important Final Requirement

Build the system so that it can grow with the organization.

Administrators should be able to add:

New asset categories

New locations

New floors

New rooms

New employees

New asset statuses

New asset conditions

Do not hard-code the entire office structure.

The goal is to create one centralized system where we can answer questions such as:

"How many laptops do we have?"

"Who has this laptop?"

"Where is this monitor?"

"What assets are present in the Director's Office?"

"How many chairs are on the second floor?"

"Which assets are under maintenance?"

"Which assets are unassigned?"

"What assets belong to the company?"

"Which employee currently has this asset?"

"How much did we spend on assets?"

"What is physically present in this room?"

"Scan this QR code and show me everything about the asset."

Make the first version fully functional with the core asset, location, employee, assignment, QR, import/export, history, and reporting features working properly. Keep the architecture clean so additional features can be added later without rebuilding the application.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7e02efdc-1bd1-43ab-84a3-a8c73f668238).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
