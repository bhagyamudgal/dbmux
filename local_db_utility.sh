#!/bin/bash

set -e

# =============================================================================
# PostgreSQL Database Utility Script
# =============================================================================

# Configuration
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Script settings
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/db_utility_$(date +%F_%H-%M-%S).log"

# Export password for psql commands
export PGPASSWORD="$POSTGRES_PASSWORD"

# =============================================================================
# Logging Functions
# =============================================================================

log_info() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $message" | tee -a "$LOG_FILE"
}

log_error() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $message" | tee -a "$LOG_FILE" >&2
}

log_success() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $message" | tee -a "$LOG_FILE"
}

# =============================================================================
# Database Connection Functions
# =============================================================================

test_connection() {
    log_info "Testing PostgreSQL connection..."
    if ! psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "SELECT 1;" >/dev/null 2>>"$LOG_FILE"; then
        log_error "Failed to connect to PostgreSQL server"
        log_error "Host: $POSTGRES_HOST, Port: $POSTGRES_PORT, User: $POSTGRES_USER"
        exit 1
    fi
    log_success "Connected to PostgreSQL server successfully"
}

# =============================================================================
# Database Listing Functions
# =============================================================================

list_databases() {
    local databases
    # Use a simpler query and better error handling
    databases=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -t -A -c "SELECT datname FROM pg_database WHERE datistemplate = false AND datname NOT IN ('postgres', 'template0', 'template1');" 2>>"$LOG_FILE" | grep -v "^$" | sort)
    
    if [ -z "$databases" ]; then
        return 1
    fi
    
    echo "$databases"
}

show_database_menu() {
    local databases=("$@")
    # Debug: log that we're showing the menu
    echo "[DEBUG] Showing menu for ${#databases[@]} databases" >> "$LOG_FILE"
    
    printf "\nAvailable databases:\n"
    for i in "${!databases[@]}"; do
        printf "%d. %s\n" "$((i+1))" "${databases[i]}"
    done
    printf "\n"
    
    # Ensure output is flushed
    exec 1>&1
}

select_database() {
    log_info "Fetching database list..."
    local databases_output
    databases_output=$(list_databases)
    local exit_code=$?
    
    if [ $exit_code -ne 0 ] || [ -z "$databases_output" ]; then
        log_error "Failed to fetch database list or no databases found"
        log_info "Trying alternative query..."
        # Try simpler query as fallback
        databases_output=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -t -c "\\l" 2>>"$LOG_FILE" | awk -F'|' 'NR>3 && NF>1 && $1 !~ /template|postgres/ {gsub(/^ +| +$/, "", $1); if($1) print $1}')
    fi
    
    if [ -z "$databases_output" ]; then
        log_error "No user databases found"
        return 1
    fi
    
    local databases=($databases_output)
    log_info "Found ${#databases[@]} databases: ${databases[*]}"
    
    # Force output flush before showing menu
    echo "" >&1
    show_database_menu "${databases[@]}"
    
    local selection
    while true; do
        read -p "Select database number (1-${#databases[@]}): " selection
        
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le ${#databases[@]} ]; then
            echo "${databases[$((selection-1))]}"
            return 0
        else
            log_error "Invalid selection. Please enter a number between 1 and ${#databases[@]}"
        fi
    done
}

# =============================================================================
# Dump Functions
# =============================================================================

generate_dump_filename() {
    local db_name="$1"
    local timestamp=$(date +%F_%H-%M-%S)
    echo "${db_name}_backup_${timestamp}.dump"
}

get_dump_filename() {
    local db_name="$1"
    local default_filename
    default_filename=$(generate_dump_filename "$db_name")
    
    echo
    echo "Default filename: $default_filename"
    read -p "Enter custom filename (or press Enter for default): " custom_filename
    
    if [ -z "$custom_filename" ]; then
        echo "$default_filename"
    else
        # Add timestamp to custom filename if not present
        if [[ "$custom_filename" != *"$(date +%F)"* ]]; then
            local name="${custom_filename%.*}"
            local ext="${custom_filename##*.}"
            if [ "$name" = "$custom_filename" ]; then
                echo "${name}_$(date +%F_%H-%M-%S).dump"
            else
                echo "${name}_$(date +%F_%H-%M-%S).${ext}"
            fi
        else
            echo "$custom_filename"
        fi
    fi
}

perform_dump() {
    log_info "Starting database dump process..."
    
    local selected_db
    if ! selected_db=$(select_database); then
        log_error "No databases available for dump"
        return 1
    fi
    
    local dump_file
    dump_file=$(get_dump_filename "$selected_db")
    local full_path="$SCRIPT_DIR/$dump_file"
    
    log_info "Selected database: $selected_db"
    log_info "Output file: $dump_file"
    
    echo
    read -p "Proceed with dump? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Dump operation cancelled by user"
        return 0
    fi
    
    log_info "Creating database dump..."
    if pg_dump \
        --host="$POSTGRES_HOST" \
        --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" \
        --format=custom \
        --file="$full_path" \
        --verbose \
        --no-privileges \
        --no-owner \
        "$selected_db" 2>>"$LOG_FILE"; then
        
        log_success "Database dump completed successfully"
        log_info "Dump file location: $full_path"
        log_info "File size: $(du -h "$full_path" | cut -f1)"
    else
        log_error "Database dump failed"
        rm -f "$full_path" 2>/dev/null
        return 1
    fi
}

# =============================================================================
# Restore Functions
# =============================================================================

get_restore_filename() {
    local filename
    while true; do
        echo
        echo "Available dump files in current directory:"
        find "$SCRIPT_DIR" -name "*.dump" -o -name "*.sql" -o -name "*.out" -o -name "*.gz" | basename -a | sort
        echo
        read -p "Enter dump filename: " filename
        
        if [ -z "$filename" ]; then
            log_error "Filename cannot be empty"
            continue
        fi
        
        local full_path="$SCRIPT_DIR/$filename"
        if [ -f "$full_path" ]; then
            echo "$full_path"
            return 0
        else
            log_error "File '$filename' not found in $SCRIPT_DIR"
        fi
    done
}

verify_dump_file() {
    local dump_file="$1"
    log_info "Verifying dump file: $(basename "$dump_file")"
    
    # Check if file is compressed
    if [[ "$dump_file" == *.gz ]]; then
        if ! gunzip -t "$dump_file" 2>>"$LOG_FILE"; then
            log_error "Invalid or corrupted gzip file"
            return 1
        fi
    elif [[ "$dump_file" == *.dump ]]; then
        # Try to list the dump contents
        if ! pg_restore --list "$dump_file" >/dev/null 2>>"$LOG_FILE"; then
            log_error "Invalid or corrupted dump file"
            return 1
        fi
    fi
    
    log_success "Dump file verification passed"
    return 0
}

create_new_database() {
    local db_name
    while true; do
        echo
        read -p "Enter new database name: " db_name
        
        if [ -z "$db_name" ]; then
            log_error "Database name cannot be empty"
            continue
        fi
        
        log_info "Creating new database: $db_name"
        if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$db_name\";" 2>>"$LOG_FILE"; then
            log_success "Database '$db_name' created successfully"
            echo "$db_name"
            return 0
        else
            log_error "Failed to create database '$db_name'"
            read -p "Try again? (yes/no): " retry
            if [ "$retry" != "yes" ]; then
                return 1
            fi
        fi
    done
}

drop_and_recreate_database() {
    local db_name="$1"
    
    log_info "Terminating active connections to database '$db_name'..."
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = '$db_name' AND pid <> pg_backend_pid();" 2>>"$LOG_FILE"
    
    log_info "Dropping database '$db_name'..."
    if ! psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$db_name\";" 2>>"$LOG_FILE"; then
        log_error "Failed to drop database '$db_name'"
        return 1
    fi
    
    log_info "Creating database '$db_name'..."
    if ! psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$db_name\";" 2>>"$LOG_FILE"; then
        log_error "Failed to create database '$db_name'"
        return 1
    fi
    
    log_success "Database '$db_name' recreated successfully"
}

select_restore_target() {
    echo
    echo "Restore options:"
    echo "1. Restore to existing database (will delete and recreate)"
    echo "2. Create new database and restore"
    echo
    
    local choice
    while true; do
        read -p "Select option (1 or 2): " choice
        case $choice in
            1)
                local selected_db
                if selected_db=$(select_database); then
                    echo
                    echo "WARNING: Database '$selected_db' will be DELETED and recreated!"
                    read -p "Are you sure? (yes/no): " confirm
                    if [ "$confirm" = "yes" ]; then
                        if drop_and_recreate_database "$selected_db"; then
                            echo "$selected_db"
                            return 0
                        fi
                    else
                        log_info "Restore operation cancelled by user"
                        return 1
                    fi
                else
                    log_error "No databases available"
                    return 1
                fi
                ;;
            2)
                create_new_database
                return $?
                ;;
            *)
                log_error "Invalid choice. Please enter 1 or 2"
                ;;
        esac
    done
}

perform_restore() {
    log_info "Starting database restore process..."
    
    local dump_file
    if ! dump_file=$(get_restore_filename); then
        return 1
    fi
    
    if ! verify_dump_file "$dump_file"; then
        return 1
    fi
    
    local target_db
    if ! target_db=$(select_restore_target); then
        return 1
    fi
    
    log_info "Restoring database from '$(basename "$dump_file")' to '$target_db'..."
    
    # Handle compressed files
    local restore_file="$dump_file"
    if [[ "$dump_file" == *.gz ]]; then
        log_info "Decompressing dump file..."
        local temp_file="${dump_file%.gz}"
        if ! gunzip -c "$dump_file" > "$temp_file" 2>>"$LOG_FILE"; then
            log_error "Failed to decompress file"
            return 1
        fi
        restore_file="$temp_file"
    fi
    
    # Perform restore
    if [[ "$restore_file" == *.dump ]]; then
        # Custom format restore
        if pg_restore -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$target_db" -v --no-privileges --no-owner "$restore_file" 2>>"$LOG_FILE"; then
            log_success "Database restore completed successfully"
        else
            log_error "Database restore failed"
            return 1
        fi
    else
        # SQL format restore
        if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$target_db" -f "$restore_file" 2>>"$LOG_FILE"; then
            log_success "Database restore completed successfully"
        else
            log_error "Database restore failed"
            return 1
        fi
    fi
    
    # Cleanup temporary file
    if [[ "$dump_file" == *.gz ]] && [ -f "$temp_file" ]; then
        rm -f "$temp_file"
        log_info "Cleaned up temporary file"
    fi
}

# =============================================================================
# Main Menu Functions
# =============================================================================

show_main_menu() {
    echo
    echo "========================================"
    echo "PostgreSQL Database Utility"
    echo "========================================"
    echo "Connection: $POSTGRES_USER@$POSTGRES_HOST:$POSTGRES_PORT"
    echo "Log file: $(basename "$LOG_FILE")"
    echo
    echo "1. Create database dump (pg_dump)"
    echo "2. Restore database (pg_restore)"
    echo "3. Exit"
    echo
}

main_menu() {
    while true; do
        show_main_menu
        read -p "Select option (1-3): " choice
        
        case $choice in
            1)
                if ! perform_dump; then
                    log_error "Dump operation failed"
                fi
                ;;
            2)
                if ! perform_restore; then
                    log_error "Restore operation failed"
                fi
                ;;
            3)
                log_info "Exiting database utility"
                echo "Goodbye!"
                exit 0
                ;;
            *)
                log_error "Invalid choice. Please enter 1, 2, or 3"
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
    done
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    log_info "Starting PostgreSQL Database Utility"
    log_info "Script directory: $SCRIPT_DIR"
    
    # Test database connection
    if ! test_connection; then
        exit 1
    fi
    
    # Run main menu
    main_menu
}

# Trap to handle script interruption
trap 'log_error "Script interrupted by user"; exit 1' INT TERM

# Run main function
main "$@" 