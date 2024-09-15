var gulp = require('gulp');
var gutil = require('gulp-util');
var ftp = require('vinyl-ftp');

/** Configuration **/
var user = 'vdymyrpp';
var password = '27sGsei_fcjT';
var host = '91.223.223.132';
var port = 21;
var localFilesGlob = ['dist/**'];
var remoteFolder = '/test';

function getFtpConnection() {
    return ftp.create({
        host: host,
        port: port,
        user: user,
        password: password,
        parallel: 3,
        idleTimeout: 1000, // Збільшено до 50 хвилин
        log: gutil.log,
        debug: gutil.log // Додано для більш детального логування
    });
}

function deployFTP(done) {
    var conn = getFtpConnection();
    var stream = gulp.src(localFilesGlob, { base: '.', buffer: false })
        .pipe(conn.newer(remoteFolder))
        .pipe(conn.dest(remoteFolder));
    
    stream.on('error', function(err) {
        gutil.log('FTP error:', err);
        done(err);
    });

    stream.on('end', function() {
        gutil.log('FTP deployment completed');
        done();
    });
}

function retryDeployFTP(retries = 3) {
    return function(done) {
        let attempts = 0;
        function attempt() {
            attempts++;
            gutil.log(`Deployment attempt ${attempts} of ${retries}`);
            deployFTP(function(err) {
                if (err && attempts < retries) {
                    gutil.log(`Deployment failed, retrying in 1 minute...`);
                    setTimeout(attempt, 1000);
                } else if (err) {
                    gutil.log('All deployment attempts failed');
                    done(err);
                } else {
                    done();
                }
            });
        }
        attempt();
    };
}

gulp.task('ftp-deploy', retryDeployFTP(3));
gulp.task('default', gulp.series('ftp-deploy'));
