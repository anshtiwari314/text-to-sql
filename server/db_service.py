from sqlalchemy import create_engine, text

def execute_generated_sql(sql_string: str, credentials: dict):
    """
    Creates a temporary connection to the user's database, executes the SQL,
    and returns the rows as a list of dictionaries.
    """
    engine_type = credentials.get('engine', 'PostgreSQL').lower()
    user = credentials.get('db_username')
    password = credentials.get('db_password')
    host = credentials.get('host')
    port = credentials.get('port', 5432)
    db_name = credentials.get('db_name')

    # Construct standard Database URI (Assuming PostgreSQL for this example)
    if engine_type == 'postgresql':
        db_uri = f"postgresql://{user}:{password}@{host}:{port}/{db_name}"
    else:
        raise ValueError(f"Unsupported engine: {engine_type}")

    engine = create_engine(db_uri)

    try:
        with engine.connect() as connection:
            # Execute the raw SQL string
            result = connection.execute(text(sql_string))
            
            # Fetch all rows and convert to list of dicts
            rows = [dict(row._mapping) for row in result.fetchall()]
            return rows
            
    except Exception as e:
        raise Exception(f"Database execution failed: {str(e)}")