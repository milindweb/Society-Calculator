# Society Loan Sanction Calculator

## Member Details

* Name
* Gen No.

---

# Loan Details

| Particular      | Present Amount | Required Amount | Deduction |
| --------------- | -------------- | --------------- | --------- |
| CD              | User Input     | User Input      | 0 (Auto)* |
| Share           | User Input     | User Input      | 0 (Auto)* |
| Old Long Loan   | User Input     | -               | -         |
| Old Short Loan  | User Input     | -               | -         |
| Other Deduction | User Input     | -               | -         |

*Deduction column displays **0** by default. After clicking **Calculate**, the application automatically computes and displays the deduction value.

---

# Formula

### CD Deduction

```
CD Deduction = max(0, Required CD - Present CD)
```

If the result is less than 0, the deduction is **0** (the member already has sufficient CD).

### Share Deduction

```
Share Deduction = max(0, Required Share - Present Share)
```

If the result is less than 0, the deduction is **0** (the member already has sufficient Share).

### CD Percentage Requirement

```
Required CD = New Loan Amount × CD Percentage (default 20%)
```

Auto-calculated when **New Loan Amount** is entered.

If the user manually enters a value in the Required CD field, the manual value overrides the automatic calculation.

The CD Percentage is configurable from **Settings**.

### Maximum Loan Amount Validation

The application validates loan amounts **before** calculation:

| Field            | Maximum (Default) |
| ---------------- | ----------------- |
| Old Long Loan    | ₹4,00,000         |
| Old Short Loan   | ₹50,000           |

If the entered loan exceeds the configured maximum, an error message is shown and calculation is prevented.

Both limits are configurable from **Settings**.

### Total Deduction

```
Total Deduction =
CD Deduction
+ Share Deduction
+ Old Long Loan
+ Old Short Loan
+ Other Deduction
```

---

# Loan Sanction

### New Loan Amount

User Input

### Amount In Hand

```
Amount In Hand =
New Loan Amount - Total Deduction
```

---

# Loan Settings

### Interest Rate

Default = **11.25%**

(User can change if society changes the rate.)

### Principal Recovery Per EMI

User Input

Example:

```
₹5,000
```

---

# EMI Calculation

### Monthly Interest

```
Monthly Interest =
Outstanding Balance × Interest Rate ÷ 12
```

Example

```
235000 × 11.25 ÷ 100 ÷ 12

= 2203.125

≈ ₹2203
```

---

### Monthly EMI

```
Monthly EMI =
Principal Recovery + Monthly Interest
```

Example

```
5000 + 2203

= ₹7203
```

---

### New Outstanding Balance

```
Outstanding Balance =
Previous Balance - Principal Recovery
```

Example

```
235000 - 5000

= 230000
```

Repeat until balance becomes **₹0**.

### Final EMI Handling

For the last EMI:

```
Interest = Outstanding Balance × Interest Rate ÷ 12
Principal Recovery = min(Remaining Balance, Scheduled Principal Recovery)
```

Interest is **always** calculated on the outstanding balance before principal recovery.

The final month's interest is **never** forced to zero.

Example:

Balance = ₹3,000

Principal Recovery = ₹5,000

Actual Principal Recovery = ₹3,000

Interest = ₹3,000 × 11.25% ÷ 12 = ₹28

Balance becomes **₹0**.

---

### Total Interest

```
Total Interest =
Sum of Monthly Interest
```

---

### Total Repayment

```
Total Repayment =
New Loan Amount + Total Interest
```

---

# Amortization Schedule

| EMI No. | Principal | Interest       | Total EMI | Balance | Remark      |
| ------- | --------- | -------------- | --------- | ------- | ----------- |
| 1       | 5,000     | 2,203          | 7,203     | 230,000 |             |
| 2       | 5,000     | 2,156          | 7,156     | 225,000 |             |
| 3       | 5,000     | 2,109          | 7,109     | 220,000 |             |
| 4       | 5,000     | 2,063          | 7,063     | 215,000 |             |
| ...     | ...       | ...            | ...       | ...     | ...         |
| Last    | Remaining | Final Interest | Final EMI | 0       | Loan Closed |

The amortization schedule may be stored internally as JSON in the database.

---

# Final Settlement Status

Three status values are used:

| Condition             | Status        |
| -------------------- | ------------- |
| Final Amount > 0     | Member Pays   |
| Final Amount < 0     | Society Pays  |
| Final Amount = 0     | Settled       |

---

# Buttons

* Calculate
* Save
* Clear

---

# Save Data

Save the following in SQLite:

* Date & Time
* Name
* Gen No.
* Present CD
* Required CD
* CD Deduction
* Present Share
* Required Share
* Share Deduction
* Old Long Loan
* Old Short Loan
* Other Deduction
* Total Deduction
* New Loan Amount
* Amount In Hand
* Interest Rate
* Principal Recovery Per EMI
* Total Interest
* Total Repayment
* Remark

Additional database fields may be added if required for application functionality, provided they do not change the user interface or calculations.

---

# Calculation Flow

```
User enters details
        ↓
Calculate CD Deduction
        ↓
Calculate Share Deduction
        ↓
Calculate Total Deduction
        ↓
Calculate Amount In Hand
        ↓
Generate Amortization Schedule
        ↓
Calculate Total Interest
        ↓
Calculate Total Repayment
        ↓
Save
```
