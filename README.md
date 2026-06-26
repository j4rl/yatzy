# Yatzyprotokoll

En webbapp för att dokumentera Yatzy-spel, räkna poäng automatiskt och spara statistik för inloggade användare.

Appen är tänkt som ett digitalt protokoll vid bordet: du skriver in alla spelare, väljer regelvariant, spelar i turordning och fyller poäng i ett protokoll med spelarna som kolumner.

## Funktioner

- Flera spelare i samma spel.
- Turordning hålls automatiskt.
- Poäng räknas från tärningarna, så man slipper räkna manuellt.
- Tärningar kan fyllas i manuellt eller slumpas.
- Klick på en tärning låser den; låsta tärningar slumpas inte om.
- Stöd för ljus/mörk tema-växling via `ld.j4rl.se`.
- Spel kan spelas utan konto, men sparas då inte i statistik.
- Inloggade användare får sparade spel och statistik i MySQL.

## Kom igång

1. Lägg projektet i en PHP-miljö, till exempel XAMPP.
2. Se till att MySQL/MariaDB kör.
3. Öppna appen i webbläsaren, till exempel:

```text
http://localhost/yatzy/
```

Standardkonfigurationen använder databasen `yatzy` och tabellprefixet `yatzy_`. Om databasen saknas försöker appen skapa den automatiskt.

Vill du ändra databas eller prefix, skapa `config.local.php` baserat på `config.local.example.php`:

```php
<?php
return [
    'db_host' => '127.0.0.1',
    'db_user' => 'root',
    'db_pass' => '',
    'db_name' => 'din_gemensamma_databas',
    'table_prefix' => 'yatzy_',
];
```

Tabellerna skapas med prefix:

- `yatzy_users`
- `yatzy_games`

## Så använder du appen

1. Klicka på `Nytt spel`.
2. Skriv en spelare per rad.
3. Välj regelvariant.
4. Kryssa eventuellt i `Maxi-Yatzy`.
5. Kryssa eventuellt i `Rak spelomgång`.
6. Klicka på `Starta spel`.
7. Fyll i tärningarna manuellt eller använd `Slumpa`.
8. Klicka på en ifylld tärning för att låsa den inför nästa slumpning.
9. Fyll en poängruta när du vill avsluta spelarens tur.

Om du är inloggad sparas färdiga spel i statistiken.

## Regler

### Standard Yatzy

- 5 tärningar.
- Max 3 slag per tur.
- Bonus 50 poäng vid minst 63 poäng i övre avdelningen.
- Yatzy ger 50 poäng.

### Maxi-Yatzy

Kan kryssas i för alla regelvarianter.

- 6 tärningar.
- Bonus 100 poäng vid minst 84 poäng i övre avdelningen.
- Maxi-Yatzy ger 100 poäng.
- Extra rader finns, till exempel tre par, femtal, full stege, hus och torn.

### Charlies regler

Tidigare kallad `Ett slag: nollbonus`.

- Bara 1 slag per tur.
- Det du slår gäller.
- Bonus ges endast om hela övre avdelningen slutar på 0.
- Samma valör kan användas som flera par eller grupper om det finns tillräckligt många tärningar.

Exempel:

- `3,3,3,3,1` kan räknas som två par i Charlies regler.
- `3,3,3,3,3` kan räknas som kåk: triss treor + par treor.

I vanliga regler krävs olika valörer för sådana grupper.

### Två slag: pott

- Max 2 vanliga slag per tur.
- Om man fyller i efter bara 1 slag får spelaren +1 slag i pott.
- Pott-slag kan användas senare.
- Om potten inte är 0 vid slutet får spelaren -50 poäng.
- Totalpoängen kan aldrig bli lägre än 0.

### Sprint

- Max 2 slag per tur.
- I övrigt vanliga poäng för valt läge.

### Rak spelomgång

Kan kryssas i för alla regelvarianter.

- Kategorierna måste fyllas uppifrån och ned.
- Om man får Yatzy eller Maxi-Yatzy får den raden fyllas direkt även i rak spelomgång.
- Efter en sådan Yatzy fortsätter man där man var i den raka ordningen.

## Konto och statistik

Du kan spela utan att logga in. Då sparas ingen statistik.

Om du skapar konto och loggar in sparas färdiga spel i MySQL. Startsidan visar de senaste spelen och sammanfattning med antal spel, bästa resultat och snitt.

## Lagring

- Inloggade användare och sparade spel lagras i MySQL med MySQLi.
- Tabeller använder konfigurerbart prefix.
- Äldre JSON-data i `data/users.json` och `data/games.json` importeras försiktigt till databasen med `INSERT IGNORE`.
- Tillfälliga/anonyma spel sparas inte i statistiken.
