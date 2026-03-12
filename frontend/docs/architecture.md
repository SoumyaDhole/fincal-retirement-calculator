# System Architecture

## Overview

The Retirement Planning Calculator is a full-stack web application that helps users estimate their retirement corpus and required monthly investment using financial planning formulas.

## Technology Stack

Frontend

* Next.js
* React
* Tailwind CSS

Backend

* Node.js
* Express.js

## Architecture Flow

User Input → Frontend (Next.js UI) → API Request → Backend (Node.js Calculation Engine) → Response → Frontend Display

## Components

### Frontend

* User input form for retirement details
* Result display panel
* Graph visualization (planned)

### Backend

* REST API endpoints
* Financial calculation logic
* Retirement corpus calculation

## API Endpoint

POST /retirement

### Input

* Current Age
* Retirement Age
* Current Annual Expenses
* Inflation Rate
* Pre-retirement Return
* Post-retirement Return
* Retirement Years

### Output

* Future Annual Expense
* Required Retirement Corpus
* Monthly SIP Required
