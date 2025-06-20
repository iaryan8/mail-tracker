from flask import Flask, request, render_template, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_cors import CORS
import logging
import csv
import io

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)

class TrackedMail(db.Model):
    id = db.Column(db.String(200), primary_key=True)
    user_email = db.Column(db.String(200))
    opened_at = db.Column(db.String(200))

# Create tables
with app.app_context():
    try:
        db.create_all()
        app.logger.info("✅ Database tables created successfully")
    except Exception as e:
        app.logger.error(f"❌ Failed to create database tables: {str(e)}")

@app.route('/track')
def track():
    try:
        mail_id = request.args.get('id')
        if not mail_id:
            app.logger.warning("❌ No mail ID provided for tracking")
            return {"error": "Mail ID is required"}, 400

        entry = TrackedMail.query.get(mail_id)
        if entry and not entry.opened_at:
            entry.opened_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            try:
                db.session.commit()
                app.logger.info(f"✅ Mail {mail_id} marked as opened")
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"❌ Failed to update mail {mail_id}: {str(e)}")
                return {"error": "Failed to update mail status"}, 500
        return '', 204
    except Exception as e:
        app.logger.error(f"❌ Error in track endpoint: {str(e)}")
        return {"error": "Internal server error"}, 500

@app.route('/store', methods=['POST'])
def store_email():
    try:
        data = request.get_json()
        if not data:
            app.logger.warning("❌ No data received in store_email")
            return {"error": "No data received"}, 400

        required_fields = ['subject', 'to', 'content', 'id']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            app.logger.warning(f"❌ Missing fields in store_email: {missing_fields}")
            return {"error": f"Missing required fields: {', '.join(missing_fields)}"}, 400

        new_entry = TrackedMail(id=data['id'], user_email=data['to'])
        try:
            db.session.add(new_entry)
            db.session.commit()
            app.logger.info(f"✅ Stored email: To={data['to']}, Subject={data['subject']}")
            return {"message": "Email stored successfully"}, 200
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"❌ Failed to store email: {str(e)}")
            return {"error": "Failed to store email"}, 500
    except Exception as e:
        app.logger.error(f"❌ Error in store_email endpoint: {str(e)}")
        return {"error": "Internal server error"}, 500

@app.route('/create_mail')
def create_mail():
    try:
        mail_id = request.args.get('id')
        user_email = request.args.get('email')
        
        if not mail_id or not user_email:
            app.logger.warning("❌ Missing mail_id or user_email in create_mail")
            return {"error": "Missing required parameters"}, 400

        app.logger.info(f"🟡 Saving Mail: ID={mail_id}, Email={user_email}")
        
        new_entry = TrackedMail(id=mail_id, user_email=user_email)
        try:
            db.session.add(new_entry)
            db.session.commit()
            app.logger.info(f"✅ Mail registered successfully: {mail_id}")
            return {"message": "Mail registered successfully"}, 200
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"❌ Failed to register mail: {str(e)}")
            return {"error": "Failed to register mail"}, 500
    except Exception as e:
        app.logger.error(f"❌ Error in create_mail endpoint: {str(e)}")
        return {"error": "Internal server error"}, 500

@app.route('/download_report')
def download_report():
    try:
        mails = TrackedMail.query.all()
        if not mails:
            app.logger.warning("No mail data available for download")
            return {"error": "No data available"}, 404

        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Mail ID', 'Recipient Email', 'Status', 'Opened At'])

        for mail in mails:
            writer.writerow([
                mail.id,
                mail.user_email,
                'Opened' if mail.opened_at else 'Not Opened',
                mail.opened_at or 'N/A'
            ])

        # Prepare the response
        output.seek(0)
        app.logger.info("✅ CSV report generated successfully")
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='mail_tracking_report.csv'
        )
    except Exception as e:
        app.logger.error(f"❌ Error generating CSV report: {str(e)}")
        return {"error": "Failed to generate report"}, 500

@app.route('/dashboard')
def dashboard():
    try:
        mails = TrackedMail.query.all()
        app.logger.info(f"✅ Dashboard loaded with {len(mails)} mails")
        return render_template('dashboard.html', mails=mails)
    except Exception as e:
        app.logger.error(f"❌ Error loading dashboard: {str(e)}")
        return {"error": "Failed to load dashboard"}, 500

if __name__ == '__main__':
    app.run(debug=True)
