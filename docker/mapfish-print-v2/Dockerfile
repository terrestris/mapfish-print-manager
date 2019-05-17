FROM terrestris/tomcat:8.5.37

RUN apk -U upgrade --update && \
    apk add curl && \
    rm -rf $CATALINA_HOME/webapps/*

RUN curl -jkSL -o /tmp/print.war http://central.maven.org/maven2/org/mapfish/print/print-servlet/2.1.4/print-servlet-2.1.4.war && \
    mkdir $CATALINA_HOME/webapps/print && \
    unzip -q /tmp/print.war -d $CATALINA_HOME/webapps/print && \
    rm /tmp/print.war

RUN apk del curl && \
    rm -rf /tmp/* /var/cache/apk/*
